import mysql.connector

# Connect to the MySQL database
db = mysql.connector.connect(
  host="localhost",
  user="root",
  password="",
  database="discord"
)

# Create a table to store the data
cursor = db.cursor()
cursor.execute("CREATE TABLE account (username VARCHAR(255), password VARCHAR(255), level INT, gems INT, balance INT)")

# Loop through the data and insert it into the table
with open("data.txt") as f:
    for line in f:
        values = line.strip().split("|")
        username = values[0]
        password = values[1]
        level = int(values[2])
        gems = int(values[3])
        balance = int(values[4])
        cursor.execute("INSERT INTO account (username, password, level, gems, balance) VALUES (%s, %s, %s, %s, %s)", (username, password, level, gems, balance))

# Commit the changes and close the connection
db.commit()
db.close()
