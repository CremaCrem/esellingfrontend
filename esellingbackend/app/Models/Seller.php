<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Seller extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'seller';

    protected $fillable = [
        'user_id',
        'shop_name',
        'slug',
        'description',
        'logo_url',
        'banner_url',
        'id_image_path',
        'contact_email',
        'contact_phone',
        'verification_status',
        'is_active',
        'order_count',
        'product_count',
    ];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}


