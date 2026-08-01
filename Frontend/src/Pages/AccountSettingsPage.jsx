import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
  Mail,
  ShieldAlert,
  Trash2,
  Upload,
  UserRoundPen,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axiosClient from "../api/axiosInstance";
import { setPassword, updatePassword } from "../api/userService";

const initialPasswordState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function ConfirmEmailModal({ title, description, confirmLabel, tone = "danger", email, onClose, onConfirm }) {
  const inputRef = useRef(null);
  const [typedEmail, setTypedEmail] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isValid = typedEmail.trim().toLowerCase() === String(email).trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border-subtle bg-card-bg shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
          <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone === "danger" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-main">{title}</h3>
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <label className="mb-2 block text-sm font-medium text-text-main">Type your email to confirm</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              ref={inputRef}
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-12 w-full rounded-2xl border border-border-subtle bg-background/70 pl-10 pr-4 text-sm text-text-main outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="mt-3 rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3 text-sm text-text-secondary">
            This action requires the exact email address <span className="text-text-main">{email}</span>.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle px-6 py-4">
          <button
            onClick={onClose}
            className="h-11 rounded-xl border border-border-subtle px-4 text-sm text-text-secondary transition hover:bg-white/[0.04] hover:text-text-main"
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onConfirm()}
            disabled={!isValid}
            className={`h-11 rounded-xl px-4 text-sm font-medium transition ${
              tone === "danger"
                ? "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/30"
                : "bg-primary text-white hover:bg-primary-accent disabled:bg-primary/40"
            } disabled:cursor-not-allowed`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const photoInputRef = useRef(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [passwordForm, setPasswordForm] = useState(initialPasswordState);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeConfirm, setActiveConfirm] = useState(null);

  const profileName = user?.name || user?.fullName || user?.email || "Account";
  const profileEmail = user?.email || "you@example.com";
  const initials = useMemo(() => {
    const words = String(profileName).trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "AR";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }, [profileName]);

  const [hasCurrentPassword, setHasPassword] = useState(user?.hasPassword || false);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(URL.createObjectURL(file));
    setStatusMessage("Profile picture preview updated.");
    event.target.value = "";
  };

  const passwordHandler = async () => {
    if(!hasCurrentPassword){
      await setPasswordHandler();
    } else {
      await updatePasswordHandler();
    }
  }

  const updatePasswordHandler = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage("New password and confirm password must match.");
      return;
    }

    if (hasCurrentPassword && !passwordForm.currentPassword.trim()) {
      setStatusMessage("Current password is required to update your password.");
      return;
    }

    const response = await updatePassword(passwordForm.currentPassword, passwordForm.newPassword);
    setPasswordForm(initialPasswordState);
  };

  const setPasswordHandler = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage("New password and confirm password must match.");
      return;
    }

    const response = await setPassword(passwordForm.newPassword);
    setPasswordForm(initialPasswordState);
    setHasPassword(true);
  };

  const handleConfirmAction = () => {
    if (activeConfirm === "disable") {
      setStatusMessage("Account disable request confirmed for this email.");
    }
    if (activeConfirm === "delete") {
      setStatusMessage("Account delete request confirmed for this email.");
    }
    setActiveConfirm(null);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_rgba(61,89,255,0.12),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(15,197,236,0.10),_transparent_30%),linear-gradient(180deg,_rgba(3,6,23,0.05),_transparent_18%)]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link to="/drive" className="inline-flex items-center gap-2 text-sm text-text-secondary transition hover:text-text-main">
          <ArrowLeft className="h-4 w-4" /> Back to My Drive
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-card-bg/70 px-3 py-1 text-xs uppercase tracking-[0.18em] text-text-secondary">
              <UserRoundPen className="h-3.5 w-3.5" /> Account settings
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-main">Personalize your account and security</h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Update your profile picture, adjust your password workflow, and manage the account-level safety actions from one place.
            </p>
          </div>

          <div id="pro-upgrade" className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/15 via-primary/10 to-transparent px-4 py-3 text-sm text-text-main shadow-lg shadow-secondary/10">
            <div className="font-medium">Upgrade to Pro</div>
            <div className="mt-1 text-xs text-text-secondary">Unlock larger storage, advanced sharing, and better collaboration.</div>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-text-main">
            <CheckCircle2 className="h-4 w-4 text-secondary-accent" />
            {statusMessage}
          </div>
        )}

        <section className="mt-8 grid gap-6">
          <div className="rounded-3xl border border-border-subtle bg-card-bg/80 p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-secondary to-primary text-2xl font-semibold text-white ring-2 ring-background">
                  {photoPreview ? <img referrerpolicy="no-referrer" src={photoPreview} alt="Profile preview" className="h-full w-full rounded-3xl object-cover" /> : initials}
                </div>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-border-subtle bg-card-bg text-text-main shadow-lg shadow-black/30 transition hover:bg-white/[0.06]"
                  aria-label="Change profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-lg font-semibold text-text-main">{profileName}</div>
                <div className="mt-1 text-sm text-text-secondary">{profileEmail}</div>
                <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                  Choose a picture that makes your workspace feel personal and easy to recognize across the app.
                </p>
              </div>

              <button
                onClick={() => photoInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-accent"
              >
                <Upload className="h-4 w-4" /> Change profile picture
              </button>
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="rounded-3xl border border-border-subtle bg-card-bg/80 p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04] text-secondary-accent">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-main">Password</h2>
                <p className="text-sm text-text-secondary">
                  {hasCurrentPassword 
                    ? "Change your password to keep your account secure." 
                    : "Create a password to allow signing in directly with your email."}
                </p>
              </div>
            </div>

            {!hasCurrentPassword && (
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3.5 text-sm text-amber-100/90 shadow-inner">
                <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-semibold text-amber-400">Security Warning: </span>
                  You currently do not have a password set. Setting a password ensures you never lose access if you lose your third-party account.
                </div>
              </div>
            )}
            {/* ------------------------------------------- */}

            <div className="mt-5 flex flex-col gap-4">
              {hasCurrentPassword && (
                <PasswordField
                  label="Current password"
                  value={passwordForm.currentPassword}
                  onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
                />
              )}
              <PasswordField
                label="New password"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
              />
              <PasswordField
                label="Confirm password"
                value={passwordForm.confirmPassword}
                onChange={(value) => setPasswordForm((prev) => ({ ...prev, confirmPassword: value }))}
              />
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                onClick={passwordHandler}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-accent"
              >
                <KeyRound className="h-4 w-4" /> 
                {hasCurrentPassword ? "Update password" : "Set password"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-border-subtle bg-card-bg/80 p-6 shadow-xl shadow-black/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-danger/10 text-danger">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-text-main">Account safety</h2>
                <p className="text-sm text-text-secondary">Disable or delete your account with email confirmation before the action is allowed.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <ActionCard
                title="Disable account"
                description="Pause access to your account. You will need to confirm the email address before the action can proceed."
                buttonLabel="Disable account"
                tone="warning"
                icon={<ShieldAlert className="h-5 w-5" />}
                onClick={() => setActiveConfirm("disable")}
              />
              <ActionCard
                title="Delete account"
                description="Permanently remove your account and all associated data after confirming the email address."
                buttonLabel="Delete account"
                tone="danger"
                icon={<Trash2 className="h-5 w-5" />}
                onClick={() => setActiveConfirm("delete")}
              />
            </div>
          </div>
        </section>
      </div>

      {activeConfirm && (
        <ConfirmEmailModal
          title={activeConfirm === "delete" ? "Delete account" : "Disable account"}
          description={
            activeConfirm === "delete"
              ? "This is permanent. Confirm the email address to proceed with account deletion."
              : "This will disable the account after email verification and can be reversed by support."
          }
          confirmLabel={activeConfirm === "delete" ? "Delete account" : "Disable account"}
          email={profileEmail}
          onClose={() => setActiveConfirm(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </main>
  );
}

function PasswordField({ label, value, onChange }) {
  return (
    <label className="flex flex-col w-full md:w-1/2">
      <span className="mb-2 block text-sm font-medium text-text-main px-4">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-border-subtle bg-background/70 px-4 text-sm text-text-main outline-none transition placeholder:text-text-secondary/70 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        placeholder={label}
      />
    </label>
  );
}

function ActionCard({ title, description, buttonLabel, tone, icon, onClick }) {
  const styles =
    tone === "danger"
      ? "border-danger/20 bg-danger/5"
      : "border-amber-400/20 bg-amber-400/5";

  return (
    <div className={`rounded-3xl border p-5 ${styles}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone === "danger" ? "bg-danger/10 text-danger" : "bg-amber-400/10 text-amber-200"}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-text-main">{title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
      </div>

      <button
        onClick={onClick}
        className={`mt-5 inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${
          tone === "danger"
            ? "bg-danger text-white hover:bg-danger/90"
            : "bg-amber-400/15 text-amber-100 hover:bg-amber-400/20"
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}