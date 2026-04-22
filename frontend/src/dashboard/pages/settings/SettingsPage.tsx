import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Settings,
    User,
    LogOut,
    Trash2,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Link2,
    Calendar,
    Mail,
    Shield,
    KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { userAuth } from "@/context/AuthContext";

// ── Helpers ────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
    { bg: "from-blue-500 to-blue-600", ring: "ring-blue-200" },
    { bg: "from-violet-500 to-purple-600", ring: "ring-violet-200" },
    { bg: "from-emerald-500 to-green-600", ring: "ring-emerald-200" },
    { bg: "from-orange-400 to-orange-600", ring: "ring-orange-200" },
    { bg: "from-pink-500 to-rose-600", ring: "ring-pink-200" },
    { bg: "from-red-500 to-red-600", ring: "ring-red-200" },
];

function getAvatarPalette(username: string) {
    const sum = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

function getInitials(fullName: string): string {
    return fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function getPasswordStrength(pwd: string): { level: number; label: string; color: string } {
    if (pwd.length === 0) return { level: 0, label: "", color: "" };
    if (pwd.length < 6) return { level: 1, label: "Muy débil", color: "bg-red-500" };
    if (pwd.length < 8) return { level: 2, label: "Débil", color: "bg-orange-400" };
    if (pwd.length < 12) return { level: 3, label: "Aceptable", color: "bg-yellow-400" };
    if (pwd.length < 16) return { level: 4, label: "Fuerte", color: "bg-blue-500" };
    return { level: 5, label: "Muy fuerte", color: "bg-emerald-500" };
}

// ── Componentes auxiliares ─────────────────────────────────────────────────

type FeedbackState = { type: "success" | "error"; message: string } | null;

function InlineFeedback({ feedback }: { feedback: FeedbackState }) {
    if (!feedback) return null;
    const isSuccess = feedback.type === "success";
    return (
        <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isSuccess
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
            }`}
        >
            {isSuccess ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
                <XCircle className="h-4 w-4 shrink-0" />
            )}
            {feedback.message}
        </div>
    );
}

function PasswordInput({
    id,
    value,
    onChange,
    placeholder,
    show,
    onToggle,
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    show: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="relative">
            <Input
                id={id}
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="pr-10"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

// ── Modal de eliminación de cuenta ────────────────────────────────────────

interface DeleteModalProps {
    hasPassword: boolean;
    onConfirm: (password?: string) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
}

function DeleteAccountModal({ hasPassword, onConfirm, onCancel, loading }: DeleteModalProps) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleConfirm = async () => {
        if (hasPassword && !password) {
            setError("Debes introducir tu contraseña para confirmar");
            return;
        }
        setError("");
        await onConfirm(hasPassword ? password : undefined);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Franja roja superior */}
                <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
                    <div className="p-1.5 rounded-full bg-white/20">
                        <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-white leading-tight">
                            Eliminar cuenta permanentemente
                        </h2>
                        <p className="text-xs text-red-100 mt-0.5">Esta acción no se puede deshacer.</p>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Lista de datos a eliminar */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                        <p className="text-sm font-medium text-foreground">Se eliminarán permanentemente:</p>
                        <ul className="space-y-1.5">
                            {[
                                "Perfil y configuración de cuenta",
                                "Hábitos y registros de seguimiento",
                                "Transacciones, ingresos y metas de ahorro",
                                "Tareas y eventos del calendario",
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {hasPassword && (
                        <div className="space-y-1.5">
                            <Label htmlFor="delete-password" className="text-sm font-medium">
                                Confirma tu contraseña
                            </Label>
                            <PasswordInput
                                id="delete-password"
                                value={password}
                                onChange={setPassword}
                                placeholder="Tu contraseña actual"
                                show={showPassword}
                                onToggle={() => setShowPassword(!showPassword)}
                            />
                            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? "Eliminando..." : "Eliminar cuenta"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Página principal ───────────────────────────────────────────────────────

export const SettingsPage = () => {
    const { user, logOut, updateProfile, changePassword, deleteAccount } = userAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState(user?.username ?? "");
    const [fullName, setFullName] = useState(user?.full_name ?? "");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileFeedback, setProfileFeedback] = useState<FeedbackState>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState<FeedbackState>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    if (!user) return null;

    const handleLogOut = () => {
        logOut();
        navigate("/login");
    };

    const handleProfileSave = async () => {
        if (!username.trim() || !fullName.trim()) {
            setProfileFeedback({ type: "error", message: "El nombre y el usuario no pueden estar vacíos" });
            return;
        }
        setProfileLoading(true);
        setProfileFeedback(null);
        const result = await updateProfile(username.trim(), fullName.trim());
        setProfileLoading(false);
        setProfileFeedback(
            result.success
                ? { type: "success", message: "Perfil actualizado correctamente" }
                : { type: "error", message: result.error?.message ?? "Error desconocido" }
        );
    };

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordFeedback({ type: "error", message: "Rellena todos los campos" });
            return;
        }
        if (newPassword.length < 8) {
            setPasswordFeedback({ type: "error", message: "La nueva contraseña debe tener al menos 8 caracteres" });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordFeedback({ type: "error", message: "Las contraseñas no coinciden" });
            return;
        }
        setPasswordLoading(true);
        setPasswordFeedback(null);
        const result = await changePassword(currentPassword, newPassword);
        setPasswordLoading(false);
        if (result.success) {
            setPasswordFeedback({ type: "success", message: "Contraseña cambiada correctamente" });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            setPasswordFeedback({ type: "error", message: result.error?.message ?? "Error desconocido" });
        }
    };

    const handleDeleteAccount = async (password?: string) => {
        setDeleteLoading(true);
        const result = await deleteAccount(password);
        setDeleteLoading(false);
        if (result.success) navigate("/login");
    };

    const palette = getAvatarPalette(user.username);
    const initials = getInitials(user.full_name || user.username);
    const pwdStrength = getPasswordStrength(newPassword);

    return (
        <div className="space-y-6">
            {/* ── HEADER ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Configuración</h1>
                    <p className="text-muted-foreground">Administra tu cuenta y preferencias</p>
                </div>
            </div>

            {/* ── PERFIL ─────────────────────────────────────────────────── */}
            <Card className="overflow-hidden">
                {/* Banda de cabecera con avatar */}
                <div className="relative bg-linear-to-br from-blue-50 via-slate-50 to-white dark:from-blue-950/30 dark:via-slate-900/20 dark:to-background border-b border-border px-6 py-6">
                    <div className="flex items-center gap-5">
                        <div
                            className={`bg-linear-to-br ${palette.bg} h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0 select-none shadow-lg ring-4 ring-white dark:ring-slate-900`}
                        >
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-semibold text-foreground truncate leading-tight">
                                {user.full_name}
                            </h2>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">@{user.username}</p>
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Miembro desde {formatDate(user.created_at)}
                            </div>
                        </div>
                    </div>
                </div>

                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50">
                            <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        Información personal
                    </CardTitle>
                    <CardDescription>Actualiza tu nombre y nombre de usuario</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="full-name" className="text-sm font-medium">
                                Nombre completo
                            </Label>
                            <Input
                                id="full-name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Tu nombre completo"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="username" className="text-sm font-medium">
                                Nombre de usuario
                            </Label>
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="tu_usuario"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            Correo electrónico
                        </Label>
                        <div className="flex items-center gap-2">
                            <Input
                                value={user.email}
                                readOnly
                                className="bg-muted/50 text-muted-foreground cursor-not-allowed flex-1"
                            />
                            <Badge variant="secondary" className="shrink-0 text-xs">
                                Solo lectura
                            </Badge>
                        </div>
                    </div>

                    <InlineFeedback feedback={profileFeedback} />

                    <Button
                        onClick={handleProfileSave}
                        disabled={profileLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {profileLoading ? "Guardando..." : "Guardar cambios"}
                    </Button>
                </CardContent>
            </Card>

            {/* ── SEGURIDAD ──────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50">
                            <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        Seguridad
                    </CardTitle>
                    <CardDescription>Gestiona el acceso a tu cuenta</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    {user.has_password ? (
                        <>
                            <div className="space-y-1.5">
                                <Label htmlFor="current-password" className="text-sm font-medium">
                                    Contraseña actual
                                </Label>
                                <PasswordInput
                                    id="current-password"
                                    value={currentPassword}
                                    onChange={setCurrentPassword}
                                    placeholder="••••••••"
                                    show={showCurrentPwd}
                                    onToggle={() => setShowCurrentPwd(!showCurrentPwd)}
                                />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new-password" className="text-sm font-medium">
                                        Nueva contraseña
                                    </Label>
                                    <PasswordInput
                                        id="new-password"
                                        value={newPassword}
                                        onChange={setNewPassword}
                                        placeholder="Mínimo 8 caracteres"
                                        show={showNewPwd}
                                        onToggle={() => setShowNewPwd(!showNewPwd)}
                                    />
                                    {/* Indicador de fortaleza */}
                                    {newPassword.length > 0 && (
                                        <div className="space-y-1 pt-1">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map((bar) => (
                                                    <div
                                                        key={bar}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                            bar <= pwdStrength.level
                                                                ? pwdStrength.color
                                                                : "bg-muted"
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {pwdStrength.label}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                                        Confirmar contraseña
                                    </Label>
                                    <PasswordInput
                                        id="confirm-password"
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                        placeholder="Repite la contraseña"
                                        show={showConfirmPwd}
                                        onToggle={() => setShowConfirmPwd(!showConfirmPwd)}
                                    />
                                    {confirmPassword.length > 0 && (
                                        <p
                                            className={`text-xs pt-1 font-medium ${
                                                confirmPassword === newPassword
                                                    ? "text-emerald-600"
                                                    : "text-red-500"
                                            }`}
                                        >
                                            {confirmPassword === newPassword
                                                ? "✓ Las contraseñas coinciden"
                                                : "✗ No coinciden"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <InlineFeedback feedback={passwordFeedback} />

                            <Button
                                onClick={handlePasswordChange}
                                disabled={passwordLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {passwordLoading ? "Cambiando..." : "Cambiar contraseña"}
                            </Button>
                        </>
                    ) : (
                        <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/30 p-4">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 shrink-0">
                                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Autenticación con Google</p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Tu cuenta usa acceso mediante Google. No es posible cambiar la contraseña desde aquí.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── CUENTAS VINCULADAS ─────────────────────────────────────── */}
            {user.social_accounts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50">
                                <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            Cuentas vinculadas
                        </CardTitle>
                        <CardDescription>Proveedores de acceso conectados a tu cuenta</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {user.social_accounts.map((sa) => (
                            <div
                                key={sa.id}
                                className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-3.5 hover:bg-muted/40 transition-colors"
                            >
                                {sa.provider === "google" && (
                                    <div className="p-1.5 rounded-lg bg-white border border-border shadow-sm shrink-0">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold capitalize">{sa.provider}</p>
                                    {sa.provider_email && (
                                        <p className="text-xs text-muted-foreground truncate">{sa.provider_email}</p>
                                    )}
                                </div>
                                <Badge className="shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                                    Activa
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── SESIÓN ────────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <LogOut className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        </div>
                        Sesión
                    </CardTitle>
                    <CardDescription>Gestiona tu sesión activa en este dispositivo</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-border bg-muted/20 p-4">
                        <div>
                            <p className="text-sm font-medium">Sesión activa</p>
                            <p className="text-sm text-muted-foreground">
                                Sesión iniciada como <span className="font-medium text-foreground">@{user.username}</span>
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLogOut} className="shrink-0">
                            <LogOut className="h-4 w-4 mr-2" />
                            Cerrar sesión
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── ZONA DE PELIGRO ───────────────────────────────────────── */}
            <Card className="border-red-200 dark:border-red-900/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
                        <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50">
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        Zona de peligro
                    </CardTitle>
                    <CardDescription>
                        Acciones permanentes e irreversibles sobre tu cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/10 p-4">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Eliminar cuenta</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Todos tus datos serán eliminados de forma permanente. No hay vuelta atrás.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            className="shrink-0"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar cuenta
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {showDeleteModal && (
                <DeleteAccountModal
                    hasPassword={user.has_password}
                    onConfirm={handleDeleteAccount}
                    onCancel={() => setShowDeleteModal(false)}
                    loading={deleteLoading}
                />
            )}
        </div>
    );
};
