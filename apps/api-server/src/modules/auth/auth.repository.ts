import { Model } from "mongoose";
import { User } from "../../models";
import { IUser } from "../../models/User";

export class UserRepository {
    private userModel: Model<IUser>;

    constructor() {
        this.userModel = User;
    }

    async findByUsername(username: string) {
        return await this.userModel.findOne({ username });
    }

    async findById(id: string) {
        return await this.userModel.findById(id);
    }

    async update(id: string, data: any) {
        return await this.userModel.findByIdAndUpdate(id, data, { new: true });
    }
}
