import { useAppContext } from "../../../context/AuthContext";

export const UserProfile: React.FC = () => {
  const { authContext } = useAppContext();

  const { userData } = authContext;

  if (!userData) {
    return null;
  }

  return (
    <div
      className="md:flex md:items-center md:justify-between md:space-x-5 
        mt-10 max-w-xl rounded-3xl border border-white/10 bg-white/5 px-8 py-10"
    >
      <div className="flex items-start space-x-5">
        <div className="shrink-0">
          <div className="relative">
            <img
              alt=""
              src={userData.userData?.imageUrl}
              className="size-16 rounded-full dark:outline dark:-outline-offset-1 dark:outline-white/10"
            />
            <span aria-hidden="true" className="absolute inset-0 rounded-full shadow-inner" />
          </div>
        </div>
        {/*
          Use vertical padding to simulate center alignment when both lines of text are one line,
          but preserve the same layout if the text wraps without making the image jump around.
        */}
        <div className="pt-1.5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {userData.userData?.name}
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {userData.userData?.email}
          </p>
        </div>
      </div>
      <div>
        <button type="button" className="main-button" onClick={authContext.logoutClick}>
          Sign out
        </button>
      </div>
    </div>
  );
};
