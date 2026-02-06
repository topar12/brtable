export type PetSpecies = "DOG" | "CAT";
export type DogSize = "SMALL" | "MEDIUM" | "LARGE" | "GIANT";

interface AgeResult {
    humanAge: number;
    stage: "PUPPY" | "JUNIOR" | "ADULT" | "SENIOR" | "GERIATRIC";
    description: string;
}

export function calculatePetAge(
    species: PetSpecies,
    years: number,
    months: number = 0,
    size: DogSize = "SMALL"
): AgeResult {
    const totalYears = years + months / 12;
    let humanAge = 0;

    if (species === "CAT") {
        // Cat Logic
        if (totalYears <= 1) {
            humanAge = totalYears * 15;
        } else if (totalYears <= 2) {
            humanAge = 15 + (totalYears - 1) * 9;
        } else {
            humanAge = 24 + (totalYears - 2) * 4;
        }
    } else {
        // Dog Logic
        if (size === "SMALL" || size === "MEDIUM") {
            if (totalYears <= 1) {
                humanAge = totalYears * 15;
            } else if (totalYears <= 2) {
                humanAge = 15 + (totalYears - 1) * 9;
            } else {
                humanAge = 24 + (totalYears - 2) * 5;
            }
        } else if (size === "LARGE") {
            if (totalYears <= 1) {
                humanAge = totalYears * 15;
            } else if (totalYears <= 2) {
                humanAge = 15 + (totalYears - 1) * 9;
            } else {
                humanAge = 24 + (totalYears - 2) * 6;
            }
        } else {
            // Giant
            if (totalYears <= 1) {
                humanAge = totalYears * 12;
            } else if (totalYears <= 2) {
                humanAge = 12 + (totalYears - 1) * 10;
            } else {
                humanAge = 22 + (totalYears - 2) * 7;
            }
        }
    }

    // Determine Lifestage
    let stage: AgeResult["stage"] = "ADULT";
    let description = "";

    // Common thresholds (simplified)
    if (totalYears < 1) {
        stage = species === "CAT" ? "JUNIOR" : "PUPPY"; // Using JUNIOR for kitten roughly
        description = species === "CAT" ? "호기심 많은 아기 고양이" : "에너지 넘치는 강아지";
    } else if (totalYears < 2) {
        stage = "JUNIOR";
        description = "질풍노도의 청소년기";
    } else if (totalYears < 7) {
        stage = "ADULT";
        description = "건강하고 활기찬 성년기";
    } else if (totalYears < 11) {
        stage = "SENIOR";
        description = "세심한 관리가 필요한 중장년기";
    } else {
        stage = "GERIATRIC";
        description = "사랑과 배려가 필요한 노년기";
    }

    // Specific overrides could go here, but keeping it general for now.

    return {
        humanAge: Math.floor(humanAge),
        stage,
        description
    };
}
