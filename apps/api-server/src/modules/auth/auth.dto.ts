import { z } from "zod";

// Schema đăng nhập
export const LoginSchema = z.object({
    username: z.string().min(1, "Username is required!"),
    password: z.string().min(1, "Password is required!")
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// Schema đổi mật khẩu
export const ChangePasswordSchema = z.object({
    oldPassword: z.string().min(6, "Old password must be at least 6 characters!"),
    newPassword: z.string().min(6, "New password must be at least 6 characters!")
});

export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;
