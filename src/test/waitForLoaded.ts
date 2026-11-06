import { act, waitFor } from '@testing-library/react';
import { expect } from 'vitest';

export const waitForLoaded = () => waitFor(() => expect(document.querySelector('[aria-busy="true"]')).toBeNull());

// For a component that renders nothing while loading: gives the simulated api time to answer.
export const waitForApiAnswers = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));
