import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

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

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error {error}</div>;
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 justify-center text-center">
            Authenticated as: {auth.user?.username}</h1>
            <div>
                <h2 className="text-2xl font-semibold text-gray-700 justify-center text-center">Existing files:</h2>
                </div>
            <div className="flex flex-col gap-4 text-sm text-gray-500 ">
                {files.map((file) => (
                    <div key={file.id} className="flex flex-row gap-4">
                        <p>{file.name}</p>
                    </div>
                ))}
            </div>
            <div>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer"
                    onClick={() => handleDelete()}
                >
                    Wipe App Data
                </button>
            </div>
        </div>
        </main>
    );
};

export default WipeApp;