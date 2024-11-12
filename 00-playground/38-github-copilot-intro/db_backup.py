import shutil
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

active_db_file = 'app.db'
backup_db_file = 'backup.db'

def backup_db():
    try:
        shutil.copy(active_db_file, backup_db_file)
        logging.info(f'Backup created: {backup_db_file}')
    except FileNotFoundError:
        logging.error(f'Error: {active_db_file} not found.')
    except PermissionError:
        logging.error(f'Error: Permission denied while accessing {active_db_file} or {backup_db_file}.')
    except Exception as e:
        logging.error(f'An unexpected error occurred: {e}')

def restore_db(backup_db_file, active_db_file):
    try:
        shutil.copy(backup_db_file, active_db_file)
        logging.info(f'Restored backup: {active_db_file}')
    except Exception as e:
        logging.error(f'Failed to restore backup: {e}')

def main():
    print('1. Backup database')
    print('2. Restore database')
    print('3. Exit')
    choice = input('Enter your choice: ')
    if choice == '1':
        backup_db()
    elif choice == '2':
        restore_db(backup_db_file, active_db_file)
    elif choice == '3':
        logging.info('Exiting...')
    else:
        logging.warning('Invalid choice')

if __name__ == '__main__':
    main()
