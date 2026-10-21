import { render, screen, waitFor } from '@testing-library/react';
import { ClassProvider, useClasses } from './ClassContext';
import { MembershipProvider, useMembership } from './MembershipContext';
import { getClassesWithAvailability, getUserBookings } from '../lib/classService';
import { membershipService } from '../lib/membershipService';

let mockUser = { id: 'demo-member', name: 'Alex' };
jest.mock('./AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../lib/classService', () => ({
  getClassesWithAvailability: jest.fn().mockResolvedValue([]),
  getUserBookings: jest.fn().mockResolvedValue([]),
}));
jest.mock('../lib/membershipService', () => ({
  membershipService: { getCurrentMembership: jest.fn().mockResolvedValue(null) },
}));

function Status() {
  const classes = useClasses();
  const membership = useMembership();
  return <p>{classes.isLoading || membership.isLoading ? 'Loading' : 'Ready'}</p>;
}
function Providers() {
  return <ClassProvider><MembershipProvider><Status /></MembershipProvider></ClassProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { id: 'demo-member', name: 'Alex' };
  (getClassesWithAvailability as jest.Mock).mockResolvedValue([]);
  (getUserBookings as jest.Mock).mockResolvedValue([]);
  (membershipService.getCurrentMembership as jest.Mock).mockResolvedValue(null);
});

test('profile updates do not repeatedly fetch bookings or membership for the same user', async () => {
  const view = render(<Providers />);
  await screen.findByText('Ready');
  expect(getUserBookings).toHaveBeenCalledTimes(1);
  expect(membershipService.getCurrentMembership).toHaveBeenCalledTimes(1);
  mockUser = { id: 'demo-member', name: 'Updated name' };
  view.rerender(<Providers />);
  await screen.findByText('Ready');
  expect(getUserBookings).toHaveBeenCalledTimes(1);
  expect(membershipService.getCurrentMembership).toHaveBeenCalledTimes(1);
  expect(getClassesWithAvailability).toHaveBeenCalledTimes(1);
});

test('switching accounts refreshes bookings and membership for the new user', async () => {
  const view = render(<Providers />);
  await screen.findByText('Ready');
  mockUser = { id: 'another-member', name: 'Jordan' };
  view.rerender(<Providers />);
  await waitFor(() => expect(getUserBookings).toHaveBeenLastCalledWith('another-member'));
  await waitFor(() => expect(membershipService.getCurrentMembership).toHaveBeenLastCalledWith('another-member'));
  await screen.findByText('Ready');
});
