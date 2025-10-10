"""
Business metrics calculation module for e-commerce data analysis.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt

# Optional seaborn import
try:
    import seaborn as sns
    HAS_SEABORN = True
except ImportError:
    HAS_SEABORN = False


class BusinessMetricsCalculator:
    """
    A class for calculating various business metrics from e-commerce data.
    """
    
    def __init__(self, sales_data: pd.DataFrame):
        """
        Initialize the metrics calculator.
        
        Args:
            sales_data (pd.DataFrame): Processed sales dataset
        """
        self.sales_data = sales_data.copy()
        self._validate_data()
    
    def _validate_data(self):
        """Validate that required columns exist in the data."""
        required_cols = ['price', 'order_id', 'purchase_year']
        missing_cols = [col for col in required_cols if col not in self.sales_data.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
    
    def calculate_revenue_metrics(self, current_year: int, 
                                previous_year: Optional[int] = None) -> Dict[str, float]:
        """
        Calculate revenue-related metrics.
        
        Args:
            current_year (int): Year to analyze
            previous_year (int, optional): Comparison year
        
        Returns:
            Dict[str, float]: Revenue metrics
        """
        current_data = self.sales_data[self.sales_data['purchase_year'] == current_year]
        
        metrics = {
            'total_revenue': current_data['price'].sum(),
            'total_orders': current_data['order_id'].nunique(),
            'average_order_value': current_data.groupby('order_id')['price'].sum().mean(),
            'total_items_sold': len(current_data)
        }
        
        if previous_year:
            previous_data = self.sales_data[self.sales_data['purchase_year'] == previous_year]
            prev_revenue = previous_data['price'].sum()
            prev_orders = previous_data['order_id'].nunique()
            prev_aov = previous_data.groupby('order_id')['price'].sum().mean()
            
            metrics.update({
                'revenue_growth_rate': ((metrics['total_revenue'] - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0,
                'order_growth_rate': ((metrics['total_orders'] - prev_orders) / prev_orders * 100) if prev_orders > 0 else 0,
                'aov_growth_rate': ((metrics['average_order_value'] - prev_aov) / prev_aov * 100) if prev_aov > 0 else 0,
                'previous_year_revenue': prev_revenue,
                'previous_year_orders': prev_orders,
                'previous_year_aov': prev_aov
            })
        
        return metrics
    
    def calculate_monthly_trends(self, year: int) -> pd.DataFrame:
        """
        Calculate month-over-month trends for a given year.
        
        Args:
            year (int): Year to analyze
        
        Returns:
            pd.DataFrame: Monthly trends data
        """
        year_data = self.sales_data[self.sales_data['purchase_year'] == year]
        
        monthly_metrics = year_data.groupby('purchase_month').agg({
            'price': 'sum',
            'order_id': 'nunique'
        }).reset_index()
        
        monthly_metrics.columns = ['month', 'revenue', 'orders']
        monthly_metrics['avg_order_value'] = year_data.groupby('purchase_month').apply(
            lambda x: x.groupby('order_id')['price'].sum().mean()
        ).values
        
        # Calculate growth rates
        monthly_metrics['revenue_growth'] = monthly_metrics['revenue'].pct_change() * 100
        monthly_metrics['order_growth'] = monthly_metrics['orders'].pct_change() * 100
        monthly_metrics['aov_growth'] = monthly_metrics['avg_order_value'].pct_change() * 100
        
        return monthly_metrics
    
    def analyze_product_performance(self, year: int, top_n: int = 10) -> Dict[str, pd.DataFrame]:
        """
        Analyze product category performance.
        
        Args:
            year (int): Year to analyze
            top_n (int): Number of top categories to return
        
        Returns:
            Dict[str, pd.DataFrame]: Product performance metrics
        """
        year_data = self.sales_data[self.sales_data['purchase_year'] == year]
        
        if 'product_category_name' not in year_data.columns:
            return {'error': 'Product category data not available'}
        
        category_metrics = year_data.groupby('product_category_name').agg({
            'price': ['sum', 'mean', 'count'],
            'order_id': 'nunique'
        }).round(2)
        
        category_metrics.columns = ['total_revenue', 'avg_item_price', 'items_sold', 'unique_orders']
        category_metrics = category_metrics.reset_index()
        category_metrics['revenue_share'] = (category_metrics['total_revenue'] / 
                                           category_metrics['total_revenue'].sum() * 100).round(2)
        
        top_categories = category_metrics.nlargest(top_n, 'total_revenue')
        
        return {
            'all_categories': category_metrics.sort_values('total_revenue', ascending=False),
            'top_categories': top_categories
        }
    
    def analyze_geographic_performance(self, year: int) -> pd.DataFrame:
        """
        Analyze sales performance by geographic region.
        
        Args:
            year (int): Year to analyze
        
        Returns:
            pd.DataFrame: Geographic performance metrics
        """
        year_data = self.sales_data[self.sales_data['purchase_year'] == year]
        
        if 'customer_state' not in year_data.columns:
            return pd.DataFrame({'error': ['Geographic data not available']})
        
        state_metrics = year_data.groupby('customer_state').agg({
            'price': 'sum',
            'order_id': 'nunique'
        }).reset_index()
        
        state_metrics.columns = ['state', 'revenue', 'orders']
        state_metrics['avg_order_value'] = year_data.groupby('customer_state').apply(
            lambda x: x.groupby('order_id')['price'].sum().mean()
        ).values
        
        state_metrics = state_metrics.sort_values('revenue', ascending=False)
        return state_metrics
    
    def analyze_customer_satisfaction(self, year: int) -> Dict[str, float]:
        """
        Calculate customer satisfaction metrics.
        
        Args:
            year (int): Year to analyze
        
        Returns:
            Dict[str, float]: Customer satisfaction metrics
        """
        year_data = self.sales_data[self.sales_data['purchase_year'] == year]
        
        if 'review_score' not in year_data.columns:
            return {'error': 'Review data not available'}
        
        # Remove duplicates for order-level analysis
        order_data = year_data.drop_duplicates('order_id')
        
        metrics = {
            'avg_review_score': order_data['review_score'].mean(),
            'total_reviews': order_data['review_score'].count(),
            'score_5_percentage': (order_data['review_score'] == 5).mean() * 100,
            'score_4_plus_percentage': (order_data['review_score'] >= 4).mean() * 100,
            'score_1_2_percentage': (order_data['review_score'] <= 2).mean() * 100
        }
        
        return metrics
    
    def analyze_delivery_performance(self, year: int) -> Dict[str, float]:
        """
        Calculate delivery performance metrics.
        
        Args:
            year (int): Year to analyze
        
        Returns:
            Dict[str, float]: Delivery performance metrics
        """
        year_data = self.sales_data[self.sales_data['purchase_year'] == year]
        
        if 'delivery_days' not in year_data.columns:
            return {'error': 'Delivery data not available'}
        
        # Remove duplicates for order-level analysis
        order_data = year_data.drop_duplicates('order_id')
        order_data = order_data.dropna(subset=['delivery_days'])
        
        metrics = {
            'avg_delivery_days': order_data['delivery_days'].mean(),
            'median_delivery_days': order_data['delivery_days'].median(),
            'fast_delivery_percentage': (order_data['delivery_days'] <= 3).mean() * 100,
            'slow_delivery_percentage': (order_data['delivery_days'] > 7).mean() * 100
        }
        
        return metrics
    
    def generate_comprehensive_report(self, current_year: int, 
                                    previous_year: Optional[int] = None) -> Dict[str, any]:
        """
        Generate a comprehensive business metrics report.
        
        Args:
            current_year (int): Year to analyze
            previous_year (int, optional): Comparison year
        
        Returns:
            Dict[str, any]: Comprehensive metrics report
        """
        report = {
            'analysis_period': current_year,
            'comparison_period': previous_year,
            'revenue_metrics': self.calculate_revenue_metrics(current_year, previous_year),
            'monthly_trends': self.calculate_monthly_trends(current_year),
            'product_performance': self.analyze_product_performance(current_year),
            'geographic_performance': self.analyze_geographic_performance(current_year),
            'customer_satisfaction': self.analyze_customer_satisfaction(current_year),
            'delivery_performance': self.analyze_delivery_performance(current_year)
        }
        
        return report


class MetricsVisualizer:
    """
    A class for creating business metrics visualizations.
    """
    
    def __init__(self, report_data: Dict[str, any]):
        """
        Initialize the visualizer.
        
        Args:
            report_data (Dict): Business metrics report data
        """
        self.report_data = report_data
        self.color_palette = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
                             '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
    
    def plot_revenue_trend(self, figsize: Tuple[int, int] = (12, 6)) -> plt.Figure:
        """
        Create a revenue trend visualization.
        
        Args:
            figsize (Tuple[int, int]): Figure size
        
        Returns:
            plt.Figure: Revenue trend plot
        """
        monthly_data = self.report_data['monthly_trends']
        year = self.report_data['analysis_period']
        
        fig, ax = plt.subplots(figsize=figsize)
        
        ax.plot(monthly_data['month'], monthly_data['revenue'], 
                marker='o', linewidth=2, markersize=8, color=self.color_palette[0])
        
        ax.set_title(f'Monthly Revenue Trend - {year}', fontsize=16, fontweight='bold', pad=20)
        ax.set_xlabel('Month', fontsize=12)
        ax.set_ylabel('Revenue ($)', fontsize=12)
        ax.grid(True, alpha=0.3)
        
        # Format y-axis as currency
        ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
        
        # Add data labels
        for i, v in enumerate(monthly_data['revenue']):
            ax.annotate(f'${v:,.0f}', (monthly_data['month'].iloc[i], v), 
                       textcoords="offset points", xytext=(0,10), ha='center', fontsize=9)
        
        plt.tight_layout()
        return fig
    
    def plot_category_performance(self, top_n: int = 10, 
                                figsize: Tuple[int, int] = (12, 8)) -> plt.Figure:
        """
        Create a product category performance visualization.
        
        Args:
            top_n (int): Number of top categories to show
            figsize (Tuple[int, int]): Figure size
        
        Returns:
            plt.Figure: Category performance plot
        """
        if 'error' in self.report_data['product_performance']:
            fig, ax = plt.subplots(figsize=figsize)
            ax.text(0.5, 0.5, 'Product category data not available', 
                   ha='center', va='center', transform=ax.transAxes, fontsize=14)
            return fig
        
        category_data = self.report_data['product_performance']['top_categories'].head(top_n)
        year = self.report_data['analysis_period']
        
        fig, ax = plt.subplots(figsize=figsize)
        
        bars = ax.barh(category_data['product_category_name'], category_data['total_revenue'],
                      color=self.color_palette[1])
        
        ax.set_title(f'Top {top_n} Product Categories by Revenue - {year}', 
                    fontsize=16, fontweight='bold', pad=20)
        ax.set_xlabel('Revenue ($)', fontsize=12)
        ax.set_ylabel('Product Category', fontsize=12)
        
        # Format x-axis as currency
        ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
        
        # Add data labels
        for i, v in enumerate(category_data['total_revenue']):
            ax.text(v, i, f'${v:,.0f}', va='center', ha='left', fontsize=10, 
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.7))
        
        plt.tight_layout()
        return fig
    
    def plot_geographic_heatmap(self) -> go.Figure:
        """
        Create a geographic revenue heatmap.
        
        Returns:
            go.Figure: Plotly choropleth map
        """
        geo_data = self.report_data['geographic_performance']
        year = self.report_data['analysis_period']
        
        if 'error' in geo_data.columns:
            fig = go.Figure()
            fig.add_annotation(text="Geographic data not available", 
                             x=0.5, y=0.5, showarrow=False, font_size=16)
            return fig
        
        fig = px.choropleth(
            geo_data,
            locations='state',
            color='revenue',
            locationmode='USA-states',
            scope='usa',
            title=f'Revenue by State - {year}',
            color_continuous_scale='Blues',
            labels={'revenue': 'Revenue ($)'}
        )
        
        fig.update_layout(
            title_font_size=16,
            title_x=0.5,
            geo=dict(showframe=False, showcoastlines=True)
        )
        
        return fig
    
    def plot_review_distribution(self, figsize: Tuple[int, int] = (10, 6)) -> plt.Figure:
        """
        Create a review score distribution visualization.
        
        Args:
            figsize (Tuple[int, int]): Figure size
        
        Returns:
            plt.Figure: Review distribution plot
        """
        year = self.report_data['analysis_period']
        
        # Get review data from the original sales data (need to pass this in)
        # For now, create a placeholder
        fig, ax = plt.subplots(figsize=figsize)
        
        satisfaction_metrics = self.report_data['customer_satisfaction']
        
        if 'error' in satisfaction_metrics:
            ax.text(0.5, 0.5, 'Review data not available', 
                   ha='center', va='center', transform=ax.transAxes, fontsize=14)
            return fig
        
        # Create a summary bar chart of satisfaction metrics
        metrics = ['Score 5 (%)', 'Score 4+ (%)', 'Score 1-2 (%)']
        values = [satisfaction_metrics['score_5_percentage'],
                 satisfaction_metrics['score_4_plus_percentage'],
                 satisfaction_metrics['score_1_2_percentage']]
        colors = ['#2ca02c', '#1f77b4', '#d62728']
        
        bars = ax.bar(metrics, values, color=colors)
        
        ax.set_title(f'Customer Satisfaction Metrics - {year}', 
                    fontsize=16, fontweight='bold', pad=20)
        ax.set_ylabel('Percentage (%)', fontsize=12)
        
        # Add data labels
        for bar, value in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                   f'{value:.1f}%', ha='center', va='bottom', fontsize=11)
        
        plt.tight_layout()
        return fig


def format_currency(value: float) -> str:
    """Format a numeric value as currency."""
    return f"${value:,.2f}"


def format_percentage(value: float, decimals: int = 1) -> str:
    """Format a numeric value as percentage."""
    return f"{value:.{decimals}f}%"


def print_metrics_summary(report: Dict[str, any]) -> None:
    """
    Print a formatted summary of business metrics.
    
    Args:
        report (Dict): Business metrics report
    """
    print("=" * 60)
    print(f"BUSINESS METRICS SUMMARY - {report['analysis_period']}")
    print("=" * 60)
    
    # Revenue metrics
    revenue_metrics = report['revenue_metrics']
    print(f"\nREVENUE PERFORMANCE:")
    print(f"  Total Revenue: {format_currency(revenue_metrics['total_revenue'])}")
    print(f"  Total Orders: {revenue_metrics['total_orders']:,}")
    print(f"  Average Order Value: {format_currency(revenue_metrics['average_order_value'])}")
    
    if 'revenue_growth_rate' in revenue_metrics:
        print(f"  Revenue Growth: {format_percentage(revenue_metrics['revenue_growth_rate'])}")
        print(f"  Order Growth: {format_percentage(revenue_metrics['order_growth_rate'])}")
    
    # Customer satisfaction
    if 'error' not in report['customer_satisfaction']:
        satisfaction = report['customer_satisfaction']
        print(f"\nCUSTOMER SATISFACTION:")
        print(f"  Average Review Score: {satisfaction['avg_review_score']:.2f}/5.0")
        print(f"  High Satisfaction (4+): {format_percentage(satisfaction['score_4_plus_percentage'])}")
    
    # Delivery performance
    if 'error' not in report['delivery_performance']:
        delivery = report['delivery_performance']
        print(f"\nDELIVERY PERFORMANCE:")
        print(f"  Average Delivery Time: {delivery['avg_delivery_days']:.1f} days")
        print(f"  Fast Delivery (≤3 days): {format_percentage(delivery['fast_delivery_percentage'])}")
    
    print("=" * 60)