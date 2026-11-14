import {IsEmail,IsNotEmpty, IsString, MaxLength} from "class-validator"
export class LoginDTO{
    @IsEmail({},{message:"Please Provide a Valid Email"})
    @IsNotEmpty({message:"Email is Reuired"})
    email:string;

    @IsString({message:"Password Must be a string"})
    @MaxLength(6,{message:"Password must be at least 8 charachers long"})
    @IsNotEmpty({message:"Password is Reuired"}) 
    password:string;
}