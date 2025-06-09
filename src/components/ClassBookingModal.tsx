import React from 'react';
import { format } from 'date-fns';
import { Clock, MapPin, Users, Dumbbell, X } from 'lucide-react';
import { Class } from '../lib/classService';
import { Button } from './ui/button';

interface ClassBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: Class | null;
  onBookClass: (cls: Class) => Promise<void>;
}

export const ClassBookingModal: React.FC<ClassBookingModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  onBookClass
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

  const handleBookClick = () => {
    if (selectedClass) {
      onBookClass(selectedClass);
    }
  };

  return (
    <div className="modal-wrapper">
      {/* Backdrop */}
      <div 
        className="modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="modal-content animate-fade-in">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Header */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 mb-4">
          <h2 className="text-xl font-semibold">{selectedClass.name}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {selectedClass.instructor} - {formatDate(selectedClass.date)}
          </p>
        </div>
        
        {/* Content */}
        <div className="py-2">
          {selectedClass.description && (
            <p className="text-sm mb-4">{selectedClass.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Time</p>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <span>{selectedClass.time}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Duration</p>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <span>{selectedClass.duration} mins</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Location</p>
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                <span>{selectedClass.location}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Level</p>
              <div className="flex items-center text-sm capitalize">
                <Dumbbell className="h-4 w-4 text-gray-500 mr-2" />
                <span>{selectedClass.level}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm font-medium mb-1">Availability</p>
            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 text-gray-500 mr-2" />
              <span>
                {selectedClass.available_spots !== undefined
                  ? `${selectedClass.available_spots} of ${selectedClass.capacity} spots available`
                  : `${selectedClass.capacity} total spots`
                }
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleBookClick}
            disabled={selectedClass.available_spots !== undefined && selectedClass.available_spots <= 0}
          >
            Book Class
          </Button>
        </div>
      </div>
    </div>
  );
}; 