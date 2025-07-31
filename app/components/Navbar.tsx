import { Link, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import { FiSettings } from "react-icons/fi";

const Navbar = () => {
  const { auth } = usePuterStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/auth");
  };

  return (
    <nav className="navbar w-full md:w-auto px-4 sm:px-6">
      <Link to="/">
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gradient">
          <span></span>RESUMATIC
        </p>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <Link
          to="/upload"
          className="primary-button w-fit text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
        >
          Upload Resume
        </Link>
        {auth.isAuthenticated && (
          <button
            onClick={handleLogout}
            className="secondary-button w-fit text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2"
          >
            Log Out
          </button>
        )}
        <div className="flex flex-col items-center justify-center">
          <Link
            to="/wipe"
            className="text-grey-600 w-fit text-lg sm:text-xl md:text-2xl"
          >
            <FiSettings />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
