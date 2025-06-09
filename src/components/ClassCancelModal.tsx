import React from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Class } from '../lib/classService';
import { Button } from './ui/button';

interface ClassCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onCancelBooking: (cls: Class) => Promise<void>;
}

export const ClassCancelModal: React.FC<ClassCancelModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onCancelBooking
}) => {
  if (!isOpen || !selectedClass) return null;

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const handleCancelClick = () => {
    if (selectedClass) {
      onCancelBooking(selectedClass);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Cancel Booking</h2>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p>
            Are you sure you want to cancel your booking for <strong>{selectedClass.name}</strong> on {formatDate(selectedClass.date)} at {selectedClass.time}?
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Keep Booking
          </Button>
          <Button 
            variant="destructive"
            onClick={handleCancelClick}
          >
            Cancel Booking
          </Button>
        </div>
      </div>
    </div>
  );
}; 