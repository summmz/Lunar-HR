import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { User, Lock, Bell } from "lucide-react";
import { toast } from "sonner";

export default function UserSettings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifications, setNotifications] = useState({
    emailOnSalary: true,
    emailOnDocuments: true,
    emailOnAnnouncements: true,
  });

  const handleProfileUpdate = async () => {
    try {
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      toast.success("Notification settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("password")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "password"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Password
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "notifications"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Notifications
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleProfileUpdate}>Save Changes</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePasswordChange}>Change Password</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Salary Updates</p>
                <p className="text-sm text-muted-foreground">Get notified about salary changes</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailOnSalary}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    emailOnSalary: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Documents Uploaded</p>
                <p className="text-sm text-muted-foreground">Get notified when documents are shared</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailOnDocuments}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    emailOnDocuments: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Announcements</p>
                <p className="text-sm text-muted-foreground">Get notified about company announcements</p>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailOnAnnouncements}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    emailOnAnnouncements: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleNotificationUpdate}>Save Preferences</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              logout();
              toast.success("Logged out successfully");
            }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
