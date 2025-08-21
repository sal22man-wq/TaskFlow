import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Map, MapPin, Navigation, Phone, ExternalLink } from 'lucide-react';
import { Customer } from '@shared/schema';

interface CustomerMapProps {
  customers: Customer[];
}

interface MapMarker {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  lat: number;
  lng: number;
  gpsAddress?: string | null;
}

export function CustomerMap({ customers }: CustomerMapProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // تحويل العملاء إلى نقاط على الخريطة
  const mapMarkers: MapMarker[] = customers
    .filter(customer => customer.gpsLatitude && customer.gpsLongitude)
    .map(customer => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      lat: parseFloat(customer.gpsLatitude!),
      lng: parseFloat(customer.gpsLongitude!),
      gpsAddress: customer.gpsAddress,
    }));

  // الحصول على موقع المستخدم الحالي
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  // فتح الموقع في خرائط جوجل
  const openInGoogleMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&t=m&z=15&output=embed`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`, '_blank');
  };

  // فتح اتجاهات القيادة
  const openDirections = (lat: number, lng: number) => {
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lat},${lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/dir//${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  // إنشاء رابط الخريطة المدمجة - نستخدم iframe بسيط مع Google Maps
  const getMapUrl = (markers: MapMarker[]) => {
    if (markers.length === 0) return '';
    
    if (markers.length === 1) {
      const marker = markers[0];
      return `https://maps.google.com/maps?q=${marker.lat},${marker.lng}&t=m&z=15&output=embed`;
    }

    // للعديد من النقاط، نحسب الوسط
    const center = markers.reduce(
      (acc, marker) => ({
        lat: acc.lat + marker.lat,
        lng: acc.lng + marker.lng,
      }),
      { lat: 0, lng: 0 }
    );
    center.lat /= markers.length;
    center.lng /= markers.length;

    return `https://maps.google.com/maps?q=${center.lat},${center.lng}&t=m&z=10&output=embed`;
  };

  if (mapMarkers.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد مواقع GPS محددة للعملاء</p>
            <p className="text-sm">أضف مواقع GPS للعملاء لعرضها على الخريطة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* معاينة سريعة للخريطة */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              خريطة العملاء ({mapMarkers.length} موقع)
            </CardTitle>
            <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  عرض مكبر
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>خريطة مواقع العملاء</DialogTitle>
                </DialogHeader>
                <div className="h-96">
                  <iframe
                    src={getMapUrl(mapMarkers)}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="خريطة العملاء"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded-lg overflow-hidden">
            <iframe
              src={getMapUrl(mapMarkers)}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="معاينة خريطة العملاء"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة العملاء مع المواقع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" />
            العملاء مع المواقع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mapMarkers.map((marker) => (
              <div key={marker.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{marker.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      {marker.phone}
                    </Badge>
                  </div>
                  
                  {marker.address && (
                    <p className="text-sm text-muted-foreground mb-1">{marker.address}</p>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    GPS: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                  </div>
                  
                  {marker.gpsAddress && (
                    <div className="text-xs text-muted-foreground bg-background/50 p-1 rounded mt-1">
                      {marker.gpsAddress}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openInGoogleMaps(marker.lat, marker.lng, marker.name)}
                    data-testid={`button-view-location-${marker.id}`}
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDirections(marker.lat, marker.lng)}
                    data-testid={`button-directions-${marker.id}`}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* معلومات إضافية */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{mapMarkers.length}</div>
              <div className="text-sm text-muted-foreground">عملاء بمواقع GPS</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{customers.length - mapMarkers.length}</div>
              <div className="text-sm text-muted-foreground">عملاء بدون مواقع</div>
            </div>
          </div>

          {userLocation && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 dark:text-blue-200">
                  موقعك الحالي: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}