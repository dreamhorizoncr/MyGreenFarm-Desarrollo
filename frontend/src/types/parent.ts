export type ParentLanguage= |"es" |"en" |"fr";

export interface Parent{
    id:number;
    identification:string;
    email:string;
    phoneNumber:string;
    address:string;
    firstName:string;
    lastName:string;
    language:ParentLanguage;
    isActive: boolean;
    createdAt: string;
}

export interface ParentRequest {
    identification: string;
    email: string;
    phoneNumber: string;
    address: string;
    firstName: string;
    lastName: string;
    language: ParentLanguage;
} 

