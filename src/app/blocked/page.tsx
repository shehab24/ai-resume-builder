import { Ban } from "lucide-react";

export default function BlockedPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center space-y-6">
                <div className="mx-auto bg-red-100 dark:bg-red-900/20 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                    <Ban className="h-10 w-10 text-red-600" />
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Suspended</h1>
                    <p className="text-gray-500 mt-2">
                        Your account has been suspended due to a violation of our terms of service.
                    </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-md p-4 text-sm text-red-800 dark:text-red-200">
                    <p>If you believe this is a mistake, please contact support.</p>
                </div>
            </div>
        </div>
    );
}
