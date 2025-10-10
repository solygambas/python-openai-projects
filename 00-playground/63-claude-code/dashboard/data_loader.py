"""
Data loading and processing module for e-commerce data analysis.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional
import warnings

warnings.filterwarnings('ignore')


class EcommerceDataLoader:
    """
    A class for loading and processing e-commerce data.
    """
    
    def __init__(self, data_path: str = 'ecommerce_data/'):
        """
        Initialize the data loader.
        
        Args:
            data_path (str): Path to the directory containing CSV files
        """
        self.data_path = data_path
        self.raw_data = {}
        self.processed_data = {}
    
    def load_raw_data(self) -> Dict[str, pd.DataFrame]:
        """
        Load all raw CSV files into DataFrames.
        
        Returns:
            Dict[str, pd.DataFrame]: Dictionary containing all raw datasets
        """
        file_mappings = {
            'orders': 'orders_dataset.csv',
            'order_items': 'order_items_dataset.csv',
            'products': 'products_dataset.csv',
            'customers': 'customers_dataset.csv',
            'reviews': 'order_reviews_dataset.csv',
            'payments': 'order_payments_dataset.csv'
        }
        
        for key, filename in file_mappings.items():
            try:
                self.raw_data[key] = pd.read_csv(f"{self.data_path}{filename}")
                print(f"Loaded {key}: {len(self.raw_data[key])} records")
            except FileNotFoundError:
                print(f"Warning: {filename} not found, skipping...")
        
        return self.raw_data
    
    def clean_orders_data(self) -> pd.DataFrame:
        """
        Clean and process orders data.
        
        Returns:
            pd.DataFrame: Cleaned orders data
        """
        orders = self.raw_data['orders'].copy()
        
        # Convert timestamp columns to datetime
        timestamp_cols = [
            'order_purchase_timestamp',
            'order_approved_at',
            'order_delivered_carrier_date',
            'order_delivered_customer_date',
            'order_estimated_delivery_date'
        ]
        
        for col in timestamp_cols:
            if col in orders.columns:
                orders[col] = pd.to_datetime(orders[col])
        
        # Extract date components
        orders['purchase_year'] = orders['order_purchase_timestamp'].dt.year
        orders['purchase_month'] = orders['order_purchase_timestamp'].dt.month
        orders['purchase_date'] = orders['order_purchase_timestamp'].dt.date
        
        return orders
    
    def clean_order_items_data(self) -> pd.DataFrame:
        """
        Clean and process order items data.
        
        Returns:
            pd.DataFrame: Cleaned order items data
        """
        order_items = self.raw_data['order_items'].copy()
        
        # Convert shipping limit date to datetime
        if 'shipping_limit_date' in order_items.columns:
            order_items['shipping_limit_date'] = pd.to_datetime(order_items['shipping_limit_date'])
        
        # Calculate total item value (price + freight)
        order_items['total_item_value'] = order_items['price'] + order_items['freight_value']
        
        return order_items
    
    def clean_reviews_data(self) -> pd.DataFrame:
        """
        Clean and process reviews data.
        
        Returns:
            pd.DataFrame: Cleaned reviews data
        """
        reviews = self.raw_data['reviews'].copy()
        
        # Convert review dates to datetime
        date_cols = ['review_creation_date', 'review_answer_timestamp']
        for col in date_cols:
            if col in reviews.columns:
                reviews[col] = pd.to_datetime(reviews[col])
        
        return reviews
    
    def create_sales_dataset(self, year_filter: Optional[int] = None, 
                           month_filter: Optional[int] = None,
                           status_filter: str = 'delivered') -> pd.DataFrame:
        """
        Create a comprehensive sales dataset by joining relevant tables.
        
        Args:
            year_filter (int, optional): Filter by specific year
            month_filter (int, optional): Filter by specific month
            status_filter (str): Filter by order status (default: 'delivered')
        
        Returns:
            pd.DataFrame: Comprehensive sales dataset
        """
        # Start with order items
        sales_data = self.processed_data['order_items'].copy()
        
        # Join with orders
        sales_data = sales_data.merge(
            self.processed_data['orders'][['order_id', 'customer_id', 'order_status', 
                                         'order_purchase_timestamp', 'order_delivered_customer_date',
                                         'purchase_year', 'purchase_month']],
            on='order_id',
            how='left'
        )
        
        # Filter by order status
        if status_filter:
            sales_data = sales_data[sales_data['order_status'] == status_filter]
        
        # Apply time filters
        if year_filter:
            sales_data = sales_data[sales_data['purchase_year'] == year_filter]
        
        if month_filter:
            sales_data = sales_data[sales_data['purchase_month'] == month_filter]
        
        # Add product information
        if 'products' in self.raw_data:
            sales_data = sales_data.merge(
                self.raw_data['products'][['product_id', 'product_category_name']],
                on='product_id',
                how='left'
            )
        
        # Add customer information (avoid duplicate joins)
        if 'customers' in self.raw_data and 'customer_id' in sales_data.columns:
            sales_data = sales_data.merge(
                self.raw_data['customers'][['customer_id', 'customer_state', 'customer_city']],
                on='customer_id',
                how='left'
            )
        
        # Add review information
        if 'reviews' in self.raw_data:
            sales_data = sales_data.merge(
                self.raw_data['reviews'][['order_id', 'review_score']],
                on='order_id',
                how='left'
            )
        
        # Calculate delivery metrics
        if 'order_delivered_customer_date' in sales_data.columns and 'order_purchase_timestamp' in sales_data.columns:
            sales_data['delivery_days'] = (
                sales_data['order_delivered_customer_date'] - 
                sales_data['order_purchase_timestamp']
            ).dt.days
        
        return sales_data
    
    def process_all_data(self) -> Dict[str, pd.DataFrame]:
        """
        Process all loaded data.
        
        Returns:
            Dict[str, pd.DataFrame]: Dictionary containing all processed datasets
        """
        if not self.raw_data:
            self.load_raw_data()
        
        # Process each dataset
        self.processed_data['orders'] = self.clean_orders_data()
        self.processed_data['order_items'] = self.clean_order_items_data()
        
        if 'reviews' in self.raw_data:
            self.processed_data['reviews'] = self.clean_reviews_data()
        
        return self.processed_data
    
    def get_data_summary(self) -> Dict[str, Dict]:
        """
        Get summary statistics for all datasets.
        
        Returns:
            Dict[str, Dict]: Summary statistics for each dataset
        """
        summary = {}
        
        for name, df in self.processed_data.items():
            summary[name] = {
                'rows': len(df),
                'columns': len(df.columns),
                'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024**2,
                'date_range': None
            }
            
            # Add date range for orders
            if name == 'orders' and 'order_purchase_timestamp' in df.columns:
                summary[name]['date_range'] = {
                    'start': df['order_purchase_timestamp'].min(),
                    'end': df['order_purchase_timestamp'].max()
                }
        
        return summary


def categorize_delivery_speed(days: float) -> str:
    """
    Categorize delivery speed based on number of days.
    
    Args:
        days (float): Number of delivery days
    
    Returns:
        str: Delivery speed category
    """
    if pd.isna(days):
        return 'Unknown'
    elif days <= 3:
        return '1-3 days'
    elif days <= 7:
        return '4-7 days'
    else:
        return '8+ days'


def load_and_process_data(data_path: str = 'ecommerce_data/') -> Tuple[EcommerceDataLoader, Dict[str, pd.DataFrame]]:
    """
    Convenience function to load and process all data.
    
    Args:
        data_path (str): Path to data directory
    
    Returns:
        Tuple[EcommerceDataLoader, Dict[str, pd.DataFrame]]: Loader instance and processed data
    """
    loader = EcommerceDataLoader(data_path)
    loader.load_raw_data()
    processed_data = loader.process_all_data()
    
    return loader, processed_data