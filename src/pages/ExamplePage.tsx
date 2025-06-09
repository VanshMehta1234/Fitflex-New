import React from 'react';
import { StandardPage } from '../components/StandardPage';
import { SectionHeader, StandardCard, Button } from '../components/ui';
import { ThemeToggle } from '../components';
import { Settings, User, Sun, Moon, RefreshCw } from 'lucide-react';

const ExamplePage: React.FC = () => {
  return (
    <StandardPage
      title="Example Page"
      description="This page demonstrates the standard layout and components"
      icon={Settings}
      actions={
        <Button size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      }
    >
      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Standard Card Example */}
        <StandardCard
          title="Standard Card"
          description="This is a standard card with a title and description"
          icon={User}
          variant="highlight"
        >
          <p className="text-gray-600 dark:text-gray-300">
            This card uses the StandardCard component which provides consistent styling.
          </p>
          
          <div className="mt-4">
            <Button size="sm">Button Example</Button>
          </div>
        </StandardCard>
        
        {/* Section with Header */}
        <div className="space-y-4">
          <SectionHeader
            title="Section Example"
            description="This is a section with a header"
            icon={Settings}
            action={
              <ThemeToggle size="sm" showLabel />
            }
          />
          
          <StandardCard variant="secondary">
            <p className="text-gray-600 dark:text-gray-300">
              Each section can have its own header and content. The SectionHeader component
              provides consistent styling across the application.
            </p>
            
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                <Sun className="w-4 h-4 mr-2" />
                Light
              </Button>
              <Button variant="outline" size="sm">
                <Moon className="w-4 h-4 mr-2" />
                Dark
              </Button>
            </div>
          </StandardCard>
        </div>
      </div>
      
      {/* Full Width Card */}
      <StandardCard className="mt-6">
        <SectionHeader
          title="Full Width Section"
          description="This section spans the full width of the page"
        />
        
        <div className="mt-4">
          <p className="text-gray-600 dark:text-gray-300">
            This demonstrates how to use a full width card with a section header.
            Use this pattern for content that needs more horizontal space.
          </p>
        </div>
      </StandardCard>
    </StandardPage>
  );
};

export default ExamplePage; 