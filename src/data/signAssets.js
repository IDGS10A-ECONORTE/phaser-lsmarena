import easy from "./easydiff.js";
import medium from "./normaldiff.js";
import hard from "./harddiff.js";

export default function getSignAssets() {
    const sets = [...easy, ...medium, ...hard];

    const assets = [];

    sets.forEach(item => {
        assets.push({
            key: `sign_${item.id}_square`,
            path: item.images.square
        });

        assets.push({
            key: `sign_${item.id}_circle`,
            path: item.images.circle
        });
    });

    return assets;
}
