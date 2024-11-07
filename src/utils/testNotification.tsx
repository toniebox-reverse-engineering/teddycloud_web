import { NotificationType } from "../types/teddyCloudNotificationTypes";
import { useTeddyCloud } from "../TeddyCloudContext";

const NotificationExample = () => {
    const { addNotification, notifications, confirmNotification } = useTeddyCloud();

    // Define possible notification types and messages
    const notificationTypes: NotificationType[] = ["success", "info", "warning", "error"];
    const messages = [
        "This is a success message.",
        "Here is some information for you.",
        "This is a warning, please take note.",
        "An error occurred, please check your input.",
    ];

    const titles = ["Success!", "Information", "Warning!", "ERROR!"];

    // Helper function to get a random item from an array
    const getRandomItem = <T,>(items: T[]): T => {
        return items[Math.floor(Math.random() * items.length)];
    };

    // Function to add a random notification
    const handleAddNotification = () => {
        const type = getRandomItem(notificationTypes);
        const title = getRandomItem(titles);
        const description = getRandomItem(messages);

        // Call addNotification with random values
        addNotification(type, title, description);
    };

    return (
        <div>
            <button onClick={handleAddNotification}>Add Random Notification</button>
        </div>
    );
};

export default NotificationExample;
