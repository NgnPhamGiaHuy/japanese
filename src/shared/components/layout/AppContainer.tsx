interface AppContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: "sm" | "md" | "lg" | "xl";
}

const MAX_WIDTHS = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
};

const AppContainer = ({ children, className = "", maxWidth = "lg" }: AppContainerProps) => {
    return <div className={`${MAX_WIDTHS[maxWidth]} mx-auto px-4 ${className}`}>{children}</div>;
};

export default AppContainer;
