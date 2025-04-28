import json
import os

def load_config(guild_id, config_file="ticket_config.json"):
    try:
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = json.load(f)
            return config.get(str(guild_id), {})
        return {}
    except Exception as e:
        print(f"Error loading config: {e}")
        return {}

def save_config(guild_id, data, config_file="ticket_config.json"):
    try:
        config = {}
        if os.path.exists(config_file):
            with open(config_file, 'r') as f:
                config = json.load(f)

        config[str(guild_id)] = data

        with open(config_file, 'w') as f:
            json.dump(config, f, indent=4)
    except Exception as e:
        print(f"Error saving config: {e}")