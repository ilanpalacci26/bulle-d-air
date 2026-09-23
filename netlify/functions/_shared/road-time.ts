const headers = { "user-agent": "BulleDAir/1.0 (+https://bulle-d-air.netlify.app)" };

export async function roadTravelMinutes(
  latitude: number,
  longitude: number,
  destination: { latitude: number; longitude: number } | null,
) {
  if (!destination) return null;
  const radians = Math.PI / 180;
  const dLat = (destination.latitude - latitude) * radians;
  const dLon = (destination.longitude - longitude) * radians;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(latitude * radians) * Math.cos(destination.latitude * radians) * Math.sin(dLon / 2) ** 2;
  const straightLineKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (straightLineKm > 500) return null;
  const coordinates = `${longitude},${latitude};${destination.longitude},${destination.latitude}`;
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`,
      { signal: AbortSignal.timeout(9000), headers },
    );
    if (!response.ok) return null;
    const seconds = Number((await response.json())?.routes?.[0]?.duration);
    const minutes = Number.isFinite(seconds) ? Math.max(1, Math.round(seconds / 60)) : null;
    return minutes && minutes <= 1440 ? minutes : null;
  } catch {
    return null;
  }
}
