import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { fetchMyProfile, updateMyProfile } from "../api/backendClient";
import { auth } from "../firebase_config";
import { useAuth } from "../hooks/useAuth";
import "../styles/profile.css";

function ProfilePage() {
	const { user } = useAuth();
	const [formData, setFormData] = useState({
		displayName: "",
		bio: "",
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [successMessage, setSuccessMessage] = useState("");

	useEffect(() => {
		const loadProfile = async () => {
			if (!user) return;

			try {
				setLoading(true);
				const profile = await fetchMyProfile();
				setFormData({
					displayName: profile.displayName || user.displayName || "",
					bio: profile.bio || "",
				});
			} catch (error) {
				setErrorMessage(error.message || "Could not load profile.");
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, [user]);

	const onChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
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
