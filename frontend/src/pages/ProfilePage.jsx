import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { fetchMyProfile, updateMyProfile } from "../api/backendClient";
import { auth, db } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/profile.css";

function ProfilePage() {
	const { user } = useAuth();
	const [formData, setFormData] = useState({
		displayName: "",
		bio: "",
		isPrivate: false,
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [followersCount, setFollowersCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);

	useEffect(() => {
		const loadProfile = async () => {
			if (!user) return;

			try {
				setLoading(true);
				const profile = await fetchMyProfile();
				setFormData({
					displayName: profile.displayName || user.displayName || "",
					bio: profile.bio || "",
					isPrivate: Boolean(profile.isPrivate),
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

	const onChange = (event) => {
		const { name, value, type, checked } = event.target;
		setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
	};

	const onSubmit = async (event) => {
		event.preventDefault();

		if (!user) return;

		try {
			setSaving(true);
			setErrorMessage("");
			setSuccessMessage("");

			await updateProfile(auth.currentUser, {
				displayName: formData.displayName,
			});

			await updateMyProfile({
				displayName: formData.displayName,
				bio: formData.bio,
				isPrivate: formData.isPrivate,
			});

			setSuccessMessage("Profile updated successfully.");
		} catch (error) {
			setErrorMessage(error.message || "Could not save profile.");
		} finally {
			setSaving(false);
		}
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
					<div className="profile-avatar">{formData.displayName?.charAt(0)?.toUpperCase() || "D"}</div>
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

					<button className="profile-button" type="submit" disabled={saving}>
						{saving ? "Saving..." : "Save Profile"}
					</button>

					{errorMessage && <p className="error-message">{errorMessage}</p>}
					{successMessage && <p className="success-message">{successMessage}</p>}
				</form>
			</section>
		</main>
	);
}

export default ProfilePage;
