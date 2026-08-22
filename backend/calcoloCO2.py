def calcoloCO2(distanza_km, mezzo):
    emissioni_per_km = {
        'car': 0.160,        
        'public_bus': 0.170, 
        'bike': 0.0,         
        'piedi': 0.0,
        'veicolo_elettrico': 0.0
    }
    
    if mezzo not in emissioni_per_km:
        mezzo = 'car' 
    
    return round(distanza_km * emissioni_per_km[mezzo], 3)
