export interface AuthResponse{
    accessToken:string;
}

export interface UserProfileReponse{
    id:string;
    email:string;
    name:string;
    role:string;
    createAt:string;
    updateAt:string;
}

export interface EventReponse{
    id:string;
    title:string;
    description:string;
    date:string;
    location:string;
    capacity:string;
    price:number;
    status:string;
    organizerId:string;
    createAt:string;
    updateAt:string;
}

export interface TicketResponse{
    id:string;
    ticketCode:string;
    eventId:string;
    userId:string;
    quantity:number;
    status:string;
    createAt:string;
    updateAt:string;
}