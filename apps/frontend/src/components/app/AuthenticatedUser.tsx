import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { useAppContext } from "../../context/AuthContext";
import React from "react";

export const AuthenticatedUser: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { authContext } = useAppContext();
  const { userData, logoutClick } = authContext;

  if (!userData?.authenticated || !userData.userData) {
    return null; // or render a fallback
  }

  return (
    <>
      

      <Menu as="div">
        <MenuButton className="sidebar-icon rounded-full 
            focus:outline-none ring-2 ring-[var(--dark-bg)] hover:ring-gray-700">
          <span className="sr-only">Open user menu</span>
          <img
            alt=""
            src={userData.userData.imageUrl}
            className=" rounded-full"
          />
        </MenuButton>

        <MenuItems
          transition
          className="absolute   z-10 mt-2 w-48 origin-top-right 
          rounded-md   py-1   outline   
          transition data-closed:scale-95 data-closed:transform 
          data-closed:opacity-0 data-enter:duration-200 
          data-enter:ease-out data-leave:duration-75 
          data-leave:ease-in bg-gray-800 shadow-none outline-offset-1 outline-white/10"
        >
          <MenuItem>
            <a
              href="#"
              onClick={onOpenSettings} 
              className="block px-4 py-2 
                  text-sm     
                  data-focus:outline-hidden text-gray-300 data-focus:bg-white/5"
            >
              Settings
            </a>
          </MenuItem>
          <MenuItem>
            <a
              href="#"
              onClick={logoutClick}  
              className="block px-4 py-2 
                  text-sm     
                  data-focus:outline-hidden text-gray-300 data-focus:bg-white/5"
            >
              Sign out
            </a>
          </MenuItem>
        </MenuItems>
      </Menu>
    </>
  );
};
