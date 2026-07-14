import axios from "axios"
import { rootURL } from "./client"

export async function login(username: string, password:string): Promise<void>{
    const response = await axios.post(`${rootURL}/token/`, {username, password})
    localStorage.setItem('access_token', response.data.access)
    localStorage.setItem('refresh_token', response.data.refresh)
}

export async function register(username: string, email: string, password: string): Promise<void> {
    await axios.post(`${rootURL}/users/register/`, {username, email, password})
}