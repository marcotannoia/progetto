def opzione_trasporto():
    """
    Restituisce una lista di dizionari con i dati dei mezzi.
    Gli attributi "id", "label", "icon" e "color" sono consumati dal frontend.
    L'attributo "action_url" è un endpoint di esempio.
    """
    
    options = [
        {
            "id": "piedi",
            "label": "A piedi",
            "icon": "🚶",
            "color": "bg-green-500", 
            "action_url": "/api/v1/walking"
        },
        {
            "id": "bike",
            "label": "Bicicletta",
            "icon": "🚲",
            "color": "bg-blue-500",
            "action_url": "/api/v1/bike"
        },
        {
            "id": "car",
            "label": "Auto",
            "icon": "🚗",
            "color": "bg-red-500",
            "action_url": "/api/v1/car"
        },
        {
            "id": "public_bus",
            "label": "Bus",
            "icon": "🚌",
            "color": "bg-orange-500",
            "action_url": "/api/v1/bus"
        }
    ]
    
    return options