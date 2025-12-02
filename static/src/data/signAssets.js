import easy from "/static/src/data/easydiff.js";
import medium from "/static/src/data/normaldiff.js";
import hard from "/static/src/data/harddiff.js";

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
