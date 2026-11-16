
import {IsEmail,IsNotEmpty, IsString, MinLength} from "class-validator"

export class RegisterDTO{
    @IsEmail({},{message:"Please Provide a Valid Email"})
    @IsNotEmpty({message:"Email is Reuired"})
    email:string;

    @IsString({message:"Password Must be a string"})
    @MinLength(8,{message:"Password must be at least 8 charachers long"})
    @IsNotEmpty({message:"Password is Reuired"})
    password:string;

    @IsString({message:"Name Must be a string"})
    @IsNotEmpty({message:"Name is Reuired"})
    name:string;
}