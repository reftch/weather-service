import type { Coordinate } from "./model";

export class CoordinateValidator {
    private static readonly LATITUDE_RANGE = [-90, 90];
    private static readonly LONGITUDE_RANGE = [-180, 180];

    /**
     * Validates if coordinates are within valid Google Maps ranges
     */
    static validateCoordinate(coord: Coordinate): boolean {
        const { latitude, longitude } = coord;

        // Check if coordinates are numbers
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return false;
        }

        // Check latitude range (-90 to 90)
        if (latitude < this.LATITUDE_RANGE[0] || latitude > this.LATITUDE_RANGE[1]) {
            return false;
        }

        // Check longitude range (-180 to 180)
        if (longitude < this.LONGITUDE_RANGE[0] || longitude > this.LONGITUDE_RANGE[1]) {
            return false;
        }

        return true;
    }

    /**
     * Validates coordinates from a string
     */
    static validateStringCoordinates(coordString: string): boolean {
        try {
            // Split the string by comma and trim whitespace
            const parts = coordString.split(',').map(part => part.trim());

            if (parts.length !== 2) {
                return false;
            }

            const latitude = parseFloat(parts[0]);
            const longitude = parseFloat(parts[1]);

            // Check if parsing was successful
            if (isNaN(latitude) || isNaN(longitude)) {
                return false;
            }

            // Create coordinate object for validation
            const coord: Coordinate = { latitude, longitude };
            return this.validateCoordinate(coord);
        } catch (error) {
            return false;
        }
    }

    /**
     * Converts string to Coordinate object
     */
    static parseStringToCoordinate(coordString: string): Coordinate | null {
        try {
            const parts = coordString.split(',').map(part => part.trim());

            if (parts.length !== 2) {
                return null;
            }

            const latitude = parseFloat(parts[0]);
            const longitude = parseFloat(parts[1]);

            if (isNaN(latitude) || isNaN(longitude)) {
                return null;
            }

            return { latitude, longitude };
        } catch (error) {
            return null;
        }
    }

    /**
     * Validates coordinate and returns detailed result
     */
    static validateCoordinateWithDetails(coord: Coordinate): {
        isValid: boolean;
        errors?: string[];
    } {
        const errors: string[] = [];

        // Check if coordinates are numbers
        if (typeof coord.latitude !== 'number') {
            errors.push('Latitude is not a number');
        }

        if (typeof coord.longitude !== 'number') {
            errors.push('Longitude is not a number');
        }

        // Check latitude range
        if (coord.latitude < this.LATITUDE_RANGE[0] || coord.latitude > this.LATITUDE_RANGE[1]) {
            errors.push(`Latitude ${coord.latitude} is out of range [-90, 90]`);
        }

        // Check longitude range
        if (coord.longitude < this.LONGITUDE_RANGE[0] || coord.longitude > this.LONGITUDE_RANGE[1]) {
            errors.push(`Longitude ${coord.longitude} is out of range [-180, 180]`);
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * Validates string coordinate and returns detailed result
     */
    static validateStringWithDetails(coordString: string): {
        isValid: boolean;
        coordinate?: Coordinate;
        errors?: string[];
    } {
        const errors: string[] = [];

        // Parse coordinates
        const coord = this.parseStringToCoordinate(coordString);
        if (!coord) {
            errors.push('Failed to parse coordinates from string');
            return { isValid: false, errors };
        }

        // Validate coordinates
        const validation = this.validateCoordinateWithDetails(coord);
        if (!validation.isValid) {
            return { isValid: false, coordinate: coord, errors: validation.errors };
        }

        return { isValid: true, coordinate: coord, errors: [] };
    }
}