import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Simple geocoding function (you can replace with actual API later)
const getCoordinatesFromLocation = (location) => {
  // Mock coordinates for Indian cities
  const locationMap = {
    'Mumbai, Maharashtra': [19.0760, 72.8777],
    'Delhi, Delhi': [28.7041, 77.1025],
    'Bangalore, Karnataka': [12.9716, 77.5946],
    'Hyderabad, Telangana': [17.3850, 78.4867],
    'Chennai, Tamil Nadu': [13.0827, 80.2707],
    'Kolkata, West Bengal': [22.5726, 88.3639],
    'Pune, Maharashtra': [18.5204, 73.8567],
    'Ahmedabad, Gujarat': [23.0225, 72.5714],
    'Jaipur, Rajasthan': [26.9124, 75.7873],
    'Surat, Gujarat': [21.1702, 72.8311],
    'Lucknow, Uttar Pradesh': [26.8467, 80.9462],
    'Kanpur, Uttar Pradesh': [26.4499, 80.3319],
    'Nagpur, Maharashtra': [21.1458, 79.0882],
    'Indore, Madhya Pradesh': [22.7196, 75.8577],
    'Thane, Maharashtra': [19.2183, 72.9781],
    'Bhopal, Madhya Pradesh': [23.2599, 77.4126],
    'Visakhapatnam, Andhra Pradesh': [17.6868, 83.2185],
    'Pimpri-Chinchwad, Maharashtra': [18.6298, 73.7997],
    'Patna, Bihar': [25.5941, 85.1376],
    'Vadodara, Gujarat': [22.3072, 73.1812],
    'Ghaziabad, Uttar Pradesh': [28.6692, 77.4538],
    'Ludhiana, Punjab': [30.9010, 75.8573],
    'Agra, Uttar Pradesh': [27.1767, 78.0081],
    'Nashik, Maharashtra': [19.9975, 73.7898],
    'Faridabad, Haryana': [28.4089, 77.3178],
    'Meerut, Uttar Pradesh': [28.9845, 77.7064],
    'Rajkot, Gujarat': [22.3039, 70.8022],
    'Varanasi, Uttar Pradesh': [25.3176, 82.9739],
    'Srinagar, Jammu and Kashmir': [34.0837, 74.7973],
    'Chandigarh, Chandigarh': [30.7333, 76.7794],
    'Goa, Goa': [15.2993, 74.1240],
    'Gurgaon, Haryana': [28.4595, 77.0266],
    'Coimbatore, Tamil Nadu': [11.0168, 76.9558],
    'Kochi, Kerala': [9.9312, 76.2673],
    'Thiruvananthapuram, Kerala': [8.5241, 76.9366],
    'Shimla, Himachal Pradesh': [31.1048, 77.1734],
  };

  return locationMap[location] || [28.7041, 77.1025]; // Default to Delhi
};

function LocationMap({ location, title }) {
  const [coordinates, setCoordinates] = useState([28.7041, 77.1025]);
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const coords = getCoordinatesFromLocation(location);
    setCoordinates(coords);
    console.log('LocationMap: Setting coordinates for', location, 'to', coords);
    
    // Set a timeout to detect if map fails to load
    const timeout = setTimeout(() => {
      if (!mapLoaded) {
        console.log('LocationMap: Map loading timeout');
        setMapError(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [location, mapLoaded]);

  if (mapError) {
    return (
      <div className="w-full h-full rounded-lg border border-gray-200 shadow-sm bg-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MapPin size={32} className="mx-auto mb-2" />
          <p className="text-sm">Map unavailable</p>
          <p className="text-xs">{location}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={coordinates}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ minHeight: '100%' }}
        zoomControl={false}
        whenCreated={(map) => {
          console.log('LocationMap: Map created successfully');
          setMapLoaded(true);
        }}
        whenReady={() => {
          console.log('LocationMap: Map is ready');
          setMapLoaded(true);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            loading: () => console.log('LocationMap: Tiles loading'),
            load: () => {
              console.log('LocationMap: Tiles loaded');
              setMapLoaded(true);
            },
            error: () => {
              console.log('LocationMap: Tile loading error');
              setMapError(true);
            }
          }}
        />
        <Marker position={coordinates}>
          <Popup>
            <div className="text-center">
              <p className="font-semibold text-sm mb-1">{title}</p>
              <p className="text-xs text-gray-600">{location}</p>
            </div>
          </Popup>
        </Marker>
        <ZoomControl position="topright" />
      </MapContainer>
    </div>
  );
}

export default LocationMap;

