import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { fetchMyProfile, updateMyProfile } from "../api/backendClient";
import { auth, db, storage } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import { uploadImageFile } from "../utils/imageUpload";
import "../styles/profile.css";

function ProfilePage() {
	// Profile form mirrors the backend record.
	const { user } = useAuth();
	const [formData, setFormData] = useState({
		displayName: "",
		bio: "",
		isPrivate: false,
		photoURL: "",
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [followersCount, setFollowersCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [photoFile, setPhotoFile] = useState(null);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [followNotifications, setFollowNotifications] = useState([]);

	useEffect(() => {
	               // Load the current profile once auth is ready.
		const loadProfile = async () => {
			if (!user) return;

			try {
				setLoading(true);
				const profile = await fetchMyProfile();
				setFormData({
					displayName: profile.displayName || user.displayName || "",
					bio: profile.bio || "",
					isPrivate: Boolean(profile.isPrivate),
					photoURL: profile.photoURL || user.photoURL || "",
				});
			} catch (error) {
				setErrorMessage(error.message || "Could not load profile.");
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, [user]);

	useEffect(() => {
	               // Live follower counts keep the page useful.
		if (!user?.uid) {
			setFollowersCount(0);
			setFollowingCount(0);
			return;
		}

		const followersQuery = query(collection(db, "follows"), where("followingId", "==", user.uid));
		const followingQuery = query(collection(db, "follows"), where("followerId", "==", user.uid));

		const unsubFollowers = onSnapshot(followersQuery, (snapshot) => {
			setFollowersCount(snapshot.size);
		});

		const unsubFollowing = onSnapshot(followingQuery, (snapshot) => {
			setFollowingCount(snapshot.size);
		});

		return () => {
			unsubFollowers();
			unsubFollowing();
		};
	}, [user?.uid]);

	useEffect(() => {
		if (!user?.uid) {
			setFollowNotifications([]);
			return;
		}

		const notificationsQuery = query(
			collection(db, "notifications"),
			where("recipientId", "==", user.uid),
			where("type", "==", "follow")
		);

		const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
			const items = snapshot.docs.map((docItem) => ({ id: docItem.id, ...(docItem.data() || {}) }));
			items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
			setFollowNotifications(items);
		});

		return () => unsubscribe();
	}, [user?.uid]);

	const onChange = (event) => {
	               // Support both text and checkbox fields.
		const { name, value, type, checked } = event.target;
		setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
	};

	const onSubmit = async (event) => {
	               // Persist the form and sync Firebase auth display name.
		event.preventDefault();

		if (!user) return;

		try {
			setSaving(true);
			setUploadingPhoto(Boolean(photoFile));
			setErrorMessage("");
			setSuccessMessage("");

			let photoURL = formData.photoURL;
			if (photoFile) {
				photoURL = await uploadImageFile({
					file: photoFile,
					storage,
					pathPrefix: `profile-photos/${user.uid}`,
				});
			}

			await updateProfile(auth.currentUser, {
				displayName: formData.displayName,
				photoURL,
			});
			await auth.currentUser?.reload();

			await updateMyProfile({
				displayName: formData.displayName,
				bio: formData.bio,
				isPrivate: formData.isPrivate,
				photoURL,
			});

			await setDoc(
				doc(db, "users", user.uid),
				{
					displayName: formData.displayName,
					bio: formData.bio,
					isPrivate: formData.isPrivate,
					photoURL,
					updatedAt: serverTimestamp(),
				},
				{ merge: true }
			);

			setFormData((prev) => ({ ...prev, photoURL }));
			setPhotoFile(null);

			setSuccessMessage("Profile updated successfully.");
		} catch (error) {
			setErrorMessage(error.message || "Could not save profile.");
		} finally {
			setUploadingPhoto(false);
			setSaving(false);
		}
	};

	const markNotificationRead = async (notificationId) => {
		await updateDoc(doc(db, "notifications", notificationId), { isRead: true, readAt: serverTimestamp() });
	};

	if (loading) {
		return (
			<main>
				<section className="profile-container">
					<p>Loading your profile...</p>
				</section>
			</main>
		);
	}

	return (
		<main>
			<section className="profile-container">
				<header className="profile-header">
					{formData.photoURL ? (
						<img src={formData.photoURL} alt="Profile" className="profile-avatar-img" />
					) : (
						<div className="profile-avatar">{formData.displayName?.charAt(0)?.toUpperCase() || "D"}</div>
					)}
					<h1>My Profile</h1>
					<p>Manage your account details and tell people what you're building.</p>
				</header>

				<div className="profile-info">
					<div className="profile-info-row">
						<span className="profile-info-label">Email</span>
						<span>{user?.email || "Not available"}</span>
					</div>
					<div className="profile-info-row">
						<span className="profile-info-label">Verified</span>
						<span>{user?.emailVerified ? "Yes" : "No"}</span>
					</div>
					<div className="profile-info-row">
						<span className="profile-info-label">Followers</span>
						<span>{followersCount.toLocaleString()}</span>
					</div>
					<div className="profile-info-row">
						<span className="profile-info-label">Following</span>
						<span>{followingCount.toLocaleString()}</span>
					</div>
				</div>

				<form className="profile-form" onSubmit={onSubmit}>
					<div className="profile-form-group">
						<label htmlFor="photo">Profile picture</label>
						<input
							id="photo"
							type="file"
							accept="image/*"
							onChange={(event) => setPhotoFile(event.target.files?.[0] || null)}
						/>
						<p className="profile-privacy-note">Upload a photo to personalize your profile.</p>
					</div>

					<div className="profile-form-group">
						<label htmlFor="displayName">Display Name</label>
						<input
							id="displayName"
							name="displayName"
							type="text"
							value={formData.displayName}
							onChange={onChange}
							required
						/>
					</div>

					<div className="profile-form-group">
						<label htmlFor="bio">Bio</label>
						<textarea
							id="bio"
							name="bio"
							rows="5"
							value={formData.bio}
							onChange={onChange}
							placeholder="Tell other developers what you are working on"
						/>
					</div>

					<div className="profile-privacy-row">
	                                               {/* Private account toggle. */}
						<label htmlFor="isPrivate">Private account</label>
						<input
							id="isPrivate"
							name="isPrivate"
							type="checkbox"
							checked={formData.isPrivate}
							onChange={onChange}
						/>
					</div>
					<p className="profile-privacy-note">
						When private, only you and followers can see your project activity.
					</p>

					<button className="profile-button" type="submit" disabled={saving || uploadingPhoto}>
						{saving || uploadingPhoto ? "Saving..." : "Save Profile"}
					</button>

					{errorMessage && <p className="error-message">{errorMessage}</p>}
					{successMessage && <p className="success-message">{successMessage}</p>}
				</form>

				<section className="profile-notifications">
					<h2>Follow notifications</h2>
					{followNotifications.length === 0 ? <p>No new follows yet.</p> : null}
					{followNotifications.map((notification) => (
						<article key={notification.id} className="notification-item">
							<div>
								<p>{notification.message || "Someone followed you."}</p>
								<small>{notification.isRead ? "Read" : "Unread"}</small>
							</div>
							{!notification.isRead ? (
								<button type="button" onClick={() => markNotificationRead(notification.id)}>
									Mark read
								</button>
							) : null}
						</article>
					))}
				</section>
			</section>
		</main>
	);
}

export default ProfilePage;
