import { BsFillSquareFill, BsFillPlusCircleFill } from "react-icons/bs";
import { useDashboard } from "../../context/DashboardContext";
import type { Project } from "../../pages/app/Dashboard";
import { useState } from "react";
import { CreateProjectDialog } from "./dialogs/CreateProjectDialog";
import { AuthenticatedUser } from "./AuthenticatedUser";
import { SettingsDialog } from "./dialogs/SettingsDialog";

export const ProjectsBar = ({ projects }: { projects: Project[] }) => {
  const { setSelectedProject, setSelectedChannel, selectedProject } =
    useDashboard();
  const [open, setOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  return (
    <>
      <div
        className="h-screen w-20 flex flex-col px-4 py-2
                      border-r border-gray-700"
      >
        <SideBarIcon
          icon={
            <img
              src="/logo.png"
              alt="LogTrakr"
              className="w-7 h-7 object-contain"
            />
          }
          text={"Dashboard"}
        />
        <Divider />
        {projects.map((project) => (
          <SideBarIcon
            key={project._id}
            icon={
              project.logoBase64 ? (
                <img
                  src={project.logoBase64}
                  alt={project.name}
                  className="w-12 h-12 object-contain rounded-lg"
                />
              ) : (
                <BsFillSquareFill size="24" />
              )
            }
            isSelected={selectedProject?._id === project._id}
            text={project.name}
            onClick={() => {
              setSelectedChannel(null);
              setSelectedProject(project);
            }}
          />
        ))}
        <Divider />
        <SideBarIcon
          key={"add-project"}
          icon={<BsFillPlusCircleFill size="24" />}
          text={"Add Project"}
          onClick={() => {
            setOpen(true);
          }}
        />
        <AuthenticatedUser setOpenSettings={setOpenSettings} />
      </div>

      <CreateProjectDialog open={open} setOpen={setOpen} />
      <SettingsDialog open={openSettings} setOpen={setOpenSettings} />
    </>
  );
};

const SideBarIcon = ({
  icon,
  text = "tooltip 💡",
  onClick,
  isSelected,
}: {
  icon: React.ReactNode;
  text?: string;
  onClick?: () => void;
  isSelected?: boolean;
}) => (
  <div
    key={text}
    className={`sidebar-icon group relative ${
      isSelected ? "sidebar-icon-selected" : ""
    }`}
    onClick={onClick}
  >
    {icon}
    <span
      className="invisible group-hover:visible absolute top-1/2 -translate-y-1/2 left-full ml-2
          w-auto p-2 min-w-max rounded-lg shadow-sm 
          text-white bg-gray-900 text-lg font-semibold
          transition-all duration-100"
    >
      {text}
    </span>
  </div>
);

const Divider = () => <hr className="sidebar-hr border-gray-700" />;
