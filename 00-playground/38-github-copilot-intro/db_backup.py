import shutil

active_db_file = 'app.db'
backup_db_file = 'backup.db'

def backup_db():
    shutil.copy(active_db_file, backup_db_file)
    print(f'Backup created: {backup_db_file}')

def restore_db():
    shutil.copy(backup_db_file, active_db_file)
    print(f'Restored backup: {active_db_file}')

def main():
    print('1. Backup database')
    print('2. Restore database')
    print('3. Exit')
    choice = input('Enter your choice: ')
    if choice == '1':
        backup_db()
    elif choice == '2':
        restore_db()
    elif choice == '3':
        print('Exiting...')
    else:
        print('Invalid choice')

if __name__ == '__main__':
    main()
