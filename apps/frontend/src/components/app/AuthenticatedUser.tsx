import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { useAppContext } from "../../context/AuthContext";
import React from "react";

export const AuthenticatedUser: React.FC<{ setOpenSettings: (open: boolean) => void }> = ({ setOpenSettings }) => {
  const { authContext } = useAppContext();
  const { userData, logoutClick } = authContext;

  if (!userData?.authenticated || !userData.userData) {
    return null; // or render a fallback
  }

  const userNavigation = [
    { name: "Settings", action: () => setOpenSettings(true) },
    { name: "Sign out", action: logoutClick },
  ];

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
          rounded-md bg-white py-1 shadow-lg outline outline-black/5 
          transition data-closed:scale-95 data-closed:transform 
          data-closed:opacity-0 data-enter:duration-200 
          data-enter:ease-out data-leave:duration-75 
          data-leave:ease-in dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
        >
          {userNavigation.map((item) => (
            <MenuItem key={item.name}>
              <a
                onClick={item.action ?? (() => {})}
                className="block px-4 py-2 
                  text-sm text-gray-700 data-focus:bg-gray-100 
                  data-focus:outline-hidden dark:text-gray-300 dark:data-focus:bg-white/5"
              >
                {item.name}
              </a>
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>
    </>
  );
};
