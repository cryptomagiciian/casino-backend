import { AuthService } from './auth.service';
import { UserPayload } from '../shared/types';
export declare class RegisterDto {
    handle: string;
    email: string;
    password: string;
}
export declare class LoginDto {
    handle: string;
    password: string;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            handle: any;
            email: any;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: any;
            handle: any;
            email: any;
        };
    }>;
    refresh(body: {
        refreshToken: string;
    }): Promise<{
        message: string;
    }>;
    getProfile(req: {
        user: UserPayload;
    }): Promise<{
        id: string;
        handle: string;
        email: string;
    }>;
}
