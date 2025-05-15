import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { PokemonList } from '../components/PokemonList';

const mockData = [
  [{ name: 'bulbasaur' }, { name: 'charmander' }],
  [{ name: 'squirtle' }, { name: 'pikachu' }],
];

let fetchCallCount = 0;
global.fetch = jest.fn(() => {
  const page = fetchCallCount;
  fetchCallCount++;
  return Promise.resolve({
    json: () => Promise.resolve({ results: mockData[page] || [] }),
  });
});

describe('PokemonList', () => {
  beforeEach(() => {
    fetchCallCount = 0;
    fetch.mockClear();

    observeMock = jest.fn();
    unobserveMock = jest.fn();
    disconnectMock = jest.fn();

    class IntersectionObserverMock {
      constructor(callback) {
        triggerCallback = callback;
      }
      observe = observeMock;
      unobserve = unobserveMock;
      disconnect = disconnectMock;
    }

    global.IntersectionObserver = IntersectionObserverMock;
  });

  it('renders Pokémon list from API', async () => {
    render(<PokemonList />);

    expect(screen.getByText(/Loading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/bulbasaur/i)).toBeInTheDocument();
      expect(screen.getByText(/charmander/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('displays images with correct src', async () => {
    render(<PokemonList />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute(
        'src',
        expect.stringContaining('bulbasaur')
      );
    });
  });

  it('loads more Pokémon when scrolled to the bottom (intersection)', async () => {
    render(<PokemonList />);
    
    await waitFor(() => screen.getByText(/bulbasaur/i));

    act(() => {
      triggerCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(screen.getByText(/squirtle/i)).toBeInTheDocument();
      expect(screen.getByText(/pikachu/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not load more Pokémon if intersection is false', async () => {
    render(<PokemonList />);
    
    await waitFor(() => screen.getByText(/bulbasaur/i));
  
    act(() => {
      triggerCallback([{ isIntersecting: false }]);
    });
  
    await new Promise((res) => setTimeout(res, 100)); 
  
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/squirtle/i)).not.toBeInTheDocument();
  });
});
