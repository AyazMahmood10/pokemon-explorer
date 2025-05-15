import { useState, useEffect, useRef } from "react";
import '../styles/PokemonList.css';


const PAGE_SIZE = 12;
  
const fetchPokemonPage = async ( offset = 0 ) => {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon?limit=${PAGE_SIZE}&offset=${offset}`
  );
  const data = await response.json();
  return data.results;
};


export const PokemonList = () => {
  const [ pokemons, setPokemons ] = useState([]);
  const [ isPending, setIsPending ] = useState(false);
  const endOfPageRef = useRef();
  const intersectionCallback = useRef();

  useEffect(() => {
    setIsPending(true);
    fetchPokemonPage().then((firstPageOfPokemons) => {
      setPokemons(firstPageOfPokemons);
      setIsPending(false);
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) =>
      intersectionCallback.current(entries)
    );
    observer.observe(endOfPageRef.current);
  }, []);

  const handleIntersection = (entries) => {
    const endOfPage = entries[0];
    if (endOfPage.isIntersecting && !isPending) {
      setIsPending(true);
      fetchPokemonPage(pokemons.length).then((newPageOfPokemons) => {
        setPokemons([...pokemons, ...newPageOfPokemons]);
        setIsPending(false);
      });
    }
  };

  useEffect(() => {
    intersectionCallback.current = handleIntersection;
  });

  return (
    <div className="container">
      <div
        className="gridContainer"
      >
        {pokemons.map(({ name }) => (
          <div
            key={name}
            className="pokemonGrid"
          >
            <h3>{name}</h3>
            <img
              src={`https://img.pokemondb.net/artwork/${name}.jpg`}
              className="pokemonImage"
            />
          </div>
        ))}
      </div>
      {isPending && (
        <div className="pendingText">Loading ...</div>
      )}
      <div ref={endOfPageRef}></div>
    </div>
  )
}
