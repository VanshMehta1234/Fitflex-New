import React from "react";
import { LucideIcon } from "lucide-react";
import { MainLayout, PageContainer, PageHeader } from "./Layout";

interface StandardPageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * StandardPage - A consistent page layout with header and container
 * 
 * Use this component to ensure all pages have a consistent look and feel.
 * It combines MainLayout, PageContainer and PageHeader in one component.
 */
export const StandardPage: React.FC<StandardPageProps> = ({
  title,
  description,
  icon,
  actions,
  children,
  fullWidth = false,
  className,
}) => {
  return (
    <MainLayout>
      <PageContainer fullWidth={fullWidth} className={className}>
        <PageHeader
          title={title}
          description={description}
          icon={icon}
          actions={actions}
        />
        {children}
      </PageContainer>
    </MainLayout>
  );
}; 