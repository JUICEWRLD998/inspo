import { createContext, useContext } from "react";
import { studioProfile } from "../lib/studioProfile";

export const ProfileContext = createContext(studioProfile(null));
export const useProfile = () => useContext(ProfileContext);
