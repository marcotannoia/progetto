def calcoloCO2(distanza_km, mezzo):
    # Le chiavi devono corrispondere agli 'id' in mezzo.py
    emissioni_per_km = {
        'car': 0.120,        
        'public_bus': 0.068, 
        'bike': 0.0,         
        'piedi': 0.0,
        'veicolo_elettrico': 0.0
    }
    
    if mezzo not in emissioni_per_km:
        mezzo = 'car' 
    
    if mezzo in ['bike', 'piedi', 'veicolo_elettrico']:
        return (" Bravo! Nessuna emissione di CO2 per questo mezzo.")
    kg_co2 = distanza_km * emissioni_per_km[mezzo] # algoritmo di calcolo
    return round(kg_co2, 3) 