// Define types directly to avoid circular imports
import type { Game, PredictionStatus, Punter, BookmakerType } from "../../types";

// Define the Prediction type directly
export interface Prediction {
    id: string;
    gameId: string;
    game: Game;
    predictionType: string;
    odds: number;
    status: PredictionStatus;
    createdAt: Date;
    description: string;
    gameCode?: string;
    punterId?: string;
    punter?: Punter;
    bookmaker?: BookmakerType;
}
