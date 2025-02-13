import { createContext, useContext, useReducer } from "react";

// Estado inicial
const initialState = {
    searchQuery: "",
    songs: [],
    selected: [],
};

// Função reducer para gerenciar as ações
const requestReducer = (state, action) => {
    switch (action.type) {
        case "SET_SEARCH_QUERY":
            return { ...state, searchQuery: action.payload };
        case "SET_SONGS":
            return { ...state, songs: action.payload };
        case "ADD_SONG":
            return {
                ...state,
                selected: state.selected.some((s) => s.id === action.payload.id)
                    ? state.selected
                    : [...state.selected, action.payload],
            };
        case "REMOVE_SONG":
            return {
                ...state,
                selected: state.selected.filter((song) => song.id !== action.payload),
            };
        case "RESET":
            return initialState;
        case "SET_SERVER_RESPONSE":
            return { ...state, serverResponse: action.payload };
        case "RESET_SELECTED":
            return { ...state, selected: [] };
        default:
            return state;
    }
};

// Criando o contexto
const RequestContext = createContext();

// Provider para envolver a aplicação
export const RequestProvider = ({ children }) => {
    const [state, dispatch] = useReducer(requestReducer, initialState);

    return (
        <RequestContext.Provider value={{ state, dispatch }}>
            {children}
        </RequestContext.Provider>
    );
};

// Hook para usar o contexto
export const useRequest = () => useContext(RequestContext);
