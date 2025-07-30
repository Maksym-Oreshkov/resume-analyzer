import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";
import AnimatedGradient from "~/ui/AnimatedGradient";

const WipeApp = () => {
  const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FSItem[]>([]);

  const loadFiles = async () => {
    const files = (await fs.readDir("./")) as FSItem[];
    setFiles(files);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading]);

  const handleDelete = async () => {
    files.forEach(async (file) => {
      await fs.delete(file.path);
    });
    await kv.flush();
    loadFiles();
  };

  const handleGoHome = () => {
    navigate("/");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error {error}</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AnimatedGradient />
      <div className="w-full max-w-4xl text-center p-8 bg-white bg-opacity-20 backdrop-blur-md rounded-2xl shadow-2xl">
        Authenticated as: {auth.user?.username}
        <div>Existing files:</div>
        <div className="flex flex-col gap-4">
          {files.map((file) => (
            <div key={file.id} className="flex flex-row gap-4">
              <p>{file.name}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4">
          <button
            className="primary-gradient text-white px-4 py-2 rounded-md cursor-pointer"
            onClick={handleGoHome}
          >
            Go to Back
          </button>
          <button
            className="secondary-gradient text-white px-4 py-2 rounded-md cursor-pointer"
            onClick={() => handleDelete()}
          >
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default WipeApp;
