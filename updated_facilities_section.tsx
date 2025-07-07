{facilities.length > 0 ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {facilities.map((facility) => {
      const permissions = getFacilityPermissions(facility.id);
      
      return (
        <Card key={facility.id} className="card-modern group hover-lift overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <Link href={`/facility/${facility.id}`} className="flex-1">
                <CardTitle className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors cursor-pointer leading-tight">
                  {facility.name}
                </CardTitle>
              </Link>
              <div className="flex items-center gap-2">
                {/* Share Button - Modern ghost button */}
                {permissions.can_share && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShareFacility(facility);
                    }}
                    size="sm"
                    variant="ghost"
                    className="btn-ghost h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Modern status badge */}
                <Badge 
                  className={facility.status === 'active' 
                    ? 'badge-default bg-green-500 text-white' 
                    : 'badge-secondary'
                  }
                >
                  {facility.status}
                </Badge>
                
                {/* Permission indicator with modern styling */}
                {userPermissions?.is_staff && !userPermissions?.is_admin && (
                  <Badge variant="outline" className="badge-outline text-xs font-medium">
                    {permissions.can_edit ? 'Edit' : 'View'}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <Link href={`/facility/${facility.id}`}>
            <CardContent className="cursor-pointer space-y-4">
              {/* Enhanced facility image with better aspect ratio */}
              {facility.image_url && (
                <div className="aspect-[3/2] w-full rounded-md overflow-hidden bg-muted">
                  <img
                    src={facility.image_url}
                    alt={facility.image_description || facility.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              
              {/* Facility details with improved spacing */}
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 mr-3 text-primary shrink-0" />
                  <span className="font-medium">{facility.facility_type}</span>
                </div>
                <div className="flex items-start text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-3 text-primary shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{facility.address}</span>
                </div>
              </div>
              
              {/* Enhanced stats grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Occupancy</p>
                    <p className="text-sm font-semibold">{facility.occupancy_rate || 0}%</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center dark:bg-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Issues</p>
                    <p className="text-sm font-semibold">{facility.active_issues || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      );
    })}
  </div>
) : (
  <Card className="card-modern text-center py-20">
    <CardContent className="space-y-6">
      <div className="h-16 w-16 mx-auto rounded-full bg-muted flex items-center justify-center">
        <Building2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-card-foreground">
          {userPermissions?.is_staff ? 'No facilities assigned' : 'No facilities found'}
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {userPermissions?.is_staff 
            ? 'Contact your administrator to get assigned to facilities.' 
            : 'Get started by adding your first facility to begin managing your properties.'
          }
        </p>
      </div>
      {userPermissions?.can_create_facility && (
        <Link href="/facilities/new">
          <Button className="btn-primary px-6 py-2.5 shadow-soft hover:shadow-medium">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Facility
          </Button>
        </Link>
      )}
    </CardContent>
  </Card>
)}
