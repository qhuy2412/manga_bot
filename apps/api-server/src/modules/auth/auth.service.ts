import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "./auth.repository";
import { LoginDTO, ChangePasswordDTO } from "./auth.dto";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../../shared/errors/AppError";
import { config } from "../../config/config";

const JWT_SECRET = config.JWT_SECRET;

export class AuthService {
    constructor(private userRepo: UserRepository) {}

    async login(data: LoginDTO) {
        const user = await this.userRepo.findByUsername(data.username);
        if (!user) {
            throw new UnauthorizedError("Invalid username or password!");
        }

        const isMatch = await bcrypt.compare(data.password, user.passwordHash);
        if (!isMatch) {
            throw new UnauthorizedError("Invalid username or password!");
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return {
            token,
            user: {
                username: user.username,
                role: user.role
            }
        };
    }

    async changePassword(userId: string, data: ChangePasswordDTO) {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new NotFoundError("User not found!");
        }

        const isMatch = await bcrypt.compare(data.oldPassword, user.passwordHash);
        if (!isMatch) {
            throw new BadRequestError("Incorrect old password!");
        }

        const newPasswordHash = await bcrypt.hash(data.newPassword, 10);
        await this.userRepo.update(userId, { passwordHash: newPasswordHash });

        return { message: "Password updated successfully!" };
    }
}